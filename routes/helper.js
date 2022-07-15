const { createTeam, createPlayer, createInning, createMatch, createExtras } = require('../utils/modelGenerator');

const playerDb = [];
const teamDb = [];
const inningsDb = [];
const matchDb = [];
const extrasDb = [];

function createNewMatch(request) {
    const { teams = [], ballsPerInning } = request;
    const teamIds = [];
    let firstBatsmanId, secondBatsmanId, bowlerId, battingTeamId, result = [];

    const numberOfPlayers = teams[0].players.length;

    for (let team of teams) {
        const playerData = [];
        const { players = [], isBatting } = team;
        const createdTeam = createTeam(team);
        const { id: teamId } = createdTeam;
        teamIds.push(teamId);
        teamDb.push(createdTeam);
        const createdInning = createInning(teamId);
        inningsDb.push(createdInning);

        for (let player of players) {
            const createdPlayer = createPlayer(player, teamId);
            playerDb.push(createdPlayer);
            const { id: playerId, name } = createdPlayer;
            playerData.push({ playerId, name });
        }

        if (isBatting) {
            firstBatsmanId = playerData[0].playerId;
            secondBatsmanId = playerData[1].playerId;
            battingTeamId = teamId;
        } else {
            bowlerId = playerData[0].playerId;
        }

        result = [...result, ...playerData];
    }

    const match = { numberOfPlayers, battingTeamId, ballsPerInning, firstBatsmanId, secondBatsmanId, bowlerId };
    const createdMatch = createMatch(match);
    const { id: matchId } = createdMatch;
    matchDb.push(createdMatch);

    teamIds.forEach(teamId => teamDb.find(team => team.id === teamId).matchId = matchId);

    return {
        players: result,
        matchId
    };
}

function addBall(request) {
    const { matchId, runs, extras, batsmanId, bowlerId, wicket } = request;
    if (!matchId) {
        throw Error('matchId required');
    } else if (runs && !batsmanId) {
        throw Error('batsmanId required');
    } else if ((extras || wicket) && (!bowlerId || !batsmanId)) {
        throw Error('bowlerId and batsmanId required');
    } else if (!runs && !(extras || wicket)) {
        throw Error('runs or extras or wicket required');
    }

    const match = matchDb.find(match => match.id === matchId);
    if (!match) {
        throw Error('Match not found');
    } else if (match.winningTeamId) {
        throw Error('Match ended...');
    }

    const innings = inningsDb.find(inning => inning.teamId === match.battingTeamId);
    const bowler = playerDb.find(player => player.id === bowlerId);
    const batsman = playerDb.find(player => player.id === batsmanId);
    const currentTeamId = match.battingTeamId;

    if (wicket) {
        batsman.isOut = true;
        bowler.wickets += 1;
        innings.balls += 1;
        innings.wicket += 1;

        if (innings.wicket === match.numberOfPlayers - 1) {
            if (match.target) {
                const teamIds = teamDb.filter(team => team.matchId === matchId).map(team => team.id);
                const winningTeamId = inningsDb.filter(inning => teamIds.includes(inning.teamId)).reduce((prev, current) => prev.runs > current.runs ? prev.teamId : current.teamId);
                match.winningTeamId = winningTeamId;
            }
            const nextTeam = teamDb.find(team => team.id !== match.battingTeamId && team.matchId === matchId);
            const batsmen = getBatsmen(nextTeam.id, match.firstBatsmanId, match.secondBatsmanId);
            const bowler = getBowler(currentTeamId);
            match.firstBatsmanId = batsmen[0].id;
            match.secondBatsmanId = batsmen[1].id;
            match.bowlerId = bowler.id;
            match.battingTeamId = nextTeam.id;
            match.target = innings.runs;
        } else {
            const batsmen = getBatsmen(currentTeamId, match.firstBatsmanId, match.secondBatsmanId);
            if (batsmanId === match.firstBatsmanId) {
                match.firstBatsmanId = batsmen[0].id;
            } else {
                match.secondBatsmanId = batsmen[0].id;
            }
        }
    } else if (extras) {
        const data = { bowlerId, matchId, inningsId: innings.id, type: extras };
        const extra = createExtras(data);
        extrasDb.push(extra);
        bowler.extras += 1;
        innings.runs += 1;
    } else {
        batsman.ballsFaced += 1;
        innings.balls += 1;
        batsman.runs += runs;
        innings.runs += runs;

        if (runs === 4) {
            batsman.fours += 1;
        } else if (runs === 6) {
            batsman.sixers += 1;
        }
    }

    if (innings.balls === match.ballsPerInning) {
        if (match.target) {
            const teamIds = teamDb.filter(team => team.matchId === matchId).map(team => team.id);
            const winningTeamId = inningsDb.filter(inning => teamIds.includes(inning.teamId)).reduce((prev, current) => prev.runs > current.runs ? prev.teamId : current.teamId);
            match.winningTeamId = winningTeamId;
        } else {
            const nextTeam = teamDb.find(team => team.id !== match.battingTeamId && team.matchId === matchId);
            const batsmen = getBatsmen(nextTeam.id);
            const bowler = getBowler(currentTeamId);
            match.firstBatsmanId = batsmen[0].id;
            match.secondBatsmanId = batsmen[1].id;
            match.bowlerId = bowler.id;
            match.battingTeamId = nextTeam.id;
            match.target = innings.runs;
        }
    }
}

function getPlayerInfo(playerId) {
    const player = playerDb.find(player => player.id === playerId);
    return player;
}

function getLiveUpdate(matchId) {
    const match = matchDb.find(match => match.id === matchId);
    if (!match) {
        throw Error('Match not found');
    }

    const innings = inningsDb.find(inning => inning.teamId === match.battingTeamId);
    const totalFours = playerDb.filter(player => player.teamId === match.battingTeamId).reduce((prevValue, current) => (prevValue + current.fours), 0);
    const totalSixers = playerDb.filter(player => player.teamId === match.battingTeamId).reduce((prevValue, current) => (prevValue + current.sixers), 0);
    const extras = playerDb.filter(player => player.teamId !== match.battingTeamId).reduce((prevValue, current) => (prevValue + current.extras), 0);
    const wides = extrasDb.filter(extras => extras.inningsId === innings.id && extras.type === 'wide').length;
    const noBalls = extrasDb.filter(extras => extras.inningsId === innings.id && extras.type === 'noBall').length;
    const firstBatsMan = playerDb.find(player => player.id === match.firstBatsmanId).name;
    const secondBatsMan = playerDb.find(player => player.id === match.secondBatsmanId).name;

    let secondInning = {};
    if (match.target) {
        const runsLeft = (match.target - innings.runs) < 0 ? 0 : (match.target - innings.runs);
        const runRate = runsLeft && runsLeft / (match.ballsPerInning - innings.balls);
        const winner = match.winningTeamId ? teamDb.find(team => team.id === match.winningTeamId).name : 'in-progress';
        secondInning = {
            runsLeft,
            runRate,
            winner
        };
    }

    return {
        totalFours,
        totalSixers,
        extras,
        wides,
        noBalls,
        firstBatsMan,
        secondBatsMan,
        ...secondInning
    };

}

function getBatsmen(batingTeamId, ...batsmanId) {
    return playerDb.filter(player => player.teamId === batingTeamId && !player.isOut && !batsmanId.includes(player.id)).sort((player1, player2) => player1.id - player2.id);
}

function getBowler(bowlingTeamId) {
    return playerDb.filter(player => player.teamId === bowlingTeamId).sort((player1, player2) => player1.id - player2.id)[0];
}

module.exports = {
    createNewMatch,
    addBall,
    getPlayerInfo,
    getLiveUpdate
};