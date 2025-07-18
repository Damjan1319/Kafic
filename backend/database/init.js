const {initScript} = require("./schema");
const {query} = require("./database");

async function initDatabase() {
    await query(initScript);
    console.log('Database schema initialised');
}

module.exports = initDatabase;