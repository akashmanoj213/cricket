const express = require('express');
const match = require('./routes/match');

const app = express();

app.use(express.json());

app.use('/api/match', match);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Listening on port 3000...');
});