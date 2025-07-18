require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDatabase = require("./database/init");
const routes = require('./routes/routes');

const app = express();
app.use(cors({origin: true, credentials: true}));
app.use(express.json());

app.use('/api', routes);

// Centralised error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
});

async function start() {
    await initDatabase();
    const port = process.env.PORT || 3003;
    app.listen(port, () => console.log(`🚀 API listening on ${port}`));
}

if (require.main === module) start();

module.exports = app;