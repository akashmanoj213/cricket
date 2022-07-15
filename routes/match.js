const express = require('express');
const { createNewMatch, getPlayerInfo, addBall, getLiveUpdate } = require('./helper');
const router = express.Router();

router.post('/create', (req, res) => {
    const request = req.body;
    let result;
    try {
        result = createNewMatch(request);
    } catch (err) {
        return res.status(500).send(`Error occured : ${err.message}`);
    }

    res.send(result);
});

router.post('/add-ball', (req, res) => {
    const request = req.body;
    try {
        addBall(request);
    } catch (err) {
        return res.status(500).send(`Error occured : ${err.message}`);
    }
    res.send('Added successfully!');
});

router.get('/player/:id', (req, res) => {
    const playerId = Number(req.params.id);
    const result = getPlayerInfo(playerId);
    res.send(result);
});

router.get('/live-score/:id', (req, res) => {
    const matchId = Number(req.params.id);
    let result;

    try {
        result = getLiveUpdate(matchId);
    } catch (err) {
        return res.status(500).send(`Error occured - ${err.message}`);
    }

    res.send(result);
});

module.exports = router;