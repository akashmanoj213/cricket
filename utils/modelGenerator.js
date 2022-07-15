let playerId = 0;
let teamId = 0;
let inningId = 0;
let matchId = 0;
let extrasId = 0;


function generatePlayerId() {
    return ++playerId;
}
function generateTeamId() {
    return ++teamId;
}
function generateInningId() {
    return ++inningId;
}
function generateMatchId() {
    return ++matchId;
}
function generateExtrasId() {
    return ++extrasId;
}

function createPlayer(name, teamId) {

    return {
        id: generatePlayerId(),
        teamId,
        name,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixers: 0,
        isOut: false,
        wickets: 0,
        extras: 0
    };
}

function createTeam(team) {
    const { name, matchId } = team;

    return {
        id: generateTeamId(),
        matchId,
        name
    };
}

function createInning(teamId) {
    return {
        id: generateInningId(),
        runs: 0,
        teamId,
        balls: 0,
        wicket: 0
    };
}

function createMatch(match) {
    const { numberOfPlayers, battingTeamId, ballsPerInning, firstBatsmanId, secondBatsmanId, bowlerId } = match;

    return {
        id: generateMatchId(),
        battingTeamId,
        ballsPerInning,
        numberOfPlayers,
        firstBatsmanId,
        secondBatsmanId,
        bowlerId,
        target: null,
        winningTeamId: null
    };
}

function createExtras(data) {
    const { type, bowlerId, matchId, inningsId } = data;

    return {
        id: generateExtrasId(),
        matchId,
        inningsId,
        bowlerId,
        type
    };
}

module.exports = {
    createTeam,
    createPlayer,
    createInning,
    createMatch,
    createExtras
};