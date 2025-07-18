const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

router.get('/menu', async (_req, res, next) => {
    try {
        const items = await MenuItem.findAvailable();
        res.json(items);
    } catch (err) {
        next(err);
    }
});

module.exports = router;