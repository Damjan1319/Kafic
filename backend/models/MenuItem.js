const {query} = require("../database/database");

class MenuItem {
    static async findAvailable() {
        const {rows} = await query(
            'SELECT * FROM menu_items WHERE available = true ORDER BY category, name'
        );
        return rows;
    }
}

module.exports = MenuItem;