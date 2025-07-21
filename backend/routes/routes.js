const express = require('express');
const {io} = require('../server'); // Import io for socket emits
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Waiter = require('../models/Waiter');
const Auth = require('../models/Auth');
const Stats = require("../models/Statistics");
const router = express.Router();

// #region Menu Routes
// Get menu items
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.getMenuItems();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get menu items (admin)
router.get('/menu-items', Auth.authenticate(), async (req, res) => {
    try {
        const menuItems = await MenuItem.getMenuItems();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Add menu item (admin)
router.post('/menu-items', Auth.authenticate(), async (req, res) => {
    try {
        const newItem = await MenuItem.addMenuItem(req.body);
        res.json(newItem);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Inventory Routes
// Get inventory (admin)
router.get('/inventory', Auth.authenticate(), async (req, res) => {
    try {
        const inventory = await MenuItem.getInventory();
        res.json(inventory);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Update inventory stock (admin)
router.put('/inventory/:id', Auth.authenticate(), async (req, res) => {
    try {
        const {stock} = req.body;
        const itemId = parseInt(req.params.id);
        await MenuItem.updateInventoryStock(itemId, stock);
        res.json({success: true});
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Table Routes
// Get table info by QR code
router.get('/table/:qrCode', async (req, res) => {
    try {
        const table = await Table.getTableByQRCode(req.params.qrCode);
        if (!table) {
            return res.status(404).json({error: 'Table not found'});
        }
        res.json(table);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get tables with orders
router.get('/tables-with-orders', Auth.authenticate(), async (req, res) => {
    try {
        const tables = await Table.getTablesWithOrders();
        res.json(tables);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get tables positions view
router.get('/tables-positions-view', Auth.authenticate(), async (req, res) => {
    try {
        const tables = await Table.getTablesPositionsView();
        res.json(tables);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Create table
router.post('/tables', Auth.authenticate(), async (req, res) => {
    const {table_number, x_position, y_position, location} = req.body;

    try {
        const tableExists = await Table.getTableByNumber(table_number);
        if (tableExists) {
            return res.status(400).json({message: 'Sto sa ovim brojem već postoji'});
        }

        const tableId = await Table.createTable(table_number, x_position, y_position, location);

        res.json({
            message: 'Sto uspešno kreiran',
            tableId,
        });
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Update table position
router.put('/tables/:id/position', Auth.authenticate(), async (req, res) => {
    const {x, y} = req.body;
    const tableId = parseInt(req.params.id);

    try {
        await Table.updateTablePosition(tableId, x, y);

        // Emit WebSocket event
        io.emit('table_position_updated', {
            tableId,
            x,
            y,
            updatedBy: req.user.id,
        });

        res.json({message: 'Pozicija stola ažurirana'});
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Update all table positions at once
router.put('/tables/positions', Auth.authenticate(), async (req, res) => {
    const {positions} = req.body; // array of {id, x, y}

    try {
        const updatePromises = positions.map(pos =>
            Table.updateTablePosition(pos.id, pos.x, pos.y)
        );

        await Promise.all(updatePromises);

        // Emit WebSocket event
        io.emit('table_layout_updated', {
            positions,
            updatedBy: req.user.id,
        });

        res.json({message: 'Raspored stolova ažuriran'});
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Order Routes
// Create order (public endpoint for customers)
router.post('/orders', async (req, res) => {
    const {table_id, items, total_price} = req.body;

    // Assume validateOrderData is implemented elsewhere or omitted

    try {
        const newOrder = await Order.createOrder(table_id, items, total_price);

        // Emit to waiters
        io.emit('new_order', newOrder);

        res.json(newOrder);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get orders for waiter
router.get('/orders', Auth.authenticate(), async (req, res) => {
    try {
        const waiterId = req.user.role === 'waiter' ? req.user.id : null;
        const orders = await Order.getOrders(waiterId);
        res.json(orders);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get all orders (public endpoint for testing)
router.get('/all-orders', async (req, res) => {
    try {
        const orders = await Order.getOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Update order status
router.put('/orders/:id', Auth.authenticate(), async (req, res) => {
    const {status} = req.body;

    try {
        const currentOrder = await Order.getOrderById(parseInt(req.params.id));
        if (!currentOrder) {
            return res.status(404).json({error: 'Order not found'});
        }

        const wasAlreadyApproved = currentOrder.status === 'approved';
        const wasAlreadyCompleted = currentOrder.status === 'completed';

        const order = await Order.updateOrderStatus(
            parseInt(req.params.id),
            status,
            (status === 'approved' || status === 'completed') ? req.user.id : null
        );

        if (!order) {
            return res.status(404).json({error: 'Order not found'});
        }

        // Update waiter statistics if order is approved or completed (and wasn't already approved)
        if ((status === 'approved' || status === 'completed') && req.user.role === 'waiter') {
            const shouldUpdateStats = !wasAlreadyApproved || (status === 'completed' && !wasAlreadyCompleted);

            if (shouldUpdateStats) {
                try {
                    await Stats.updateWaiterStats(req.user.id, order);

                    // Emit socket event to notify waiter about stats update
                    const updatedStats = await Stats.getWaiterTodayStats(req.user.id);
                    io.emit('waiter_stats_updated', {
                        waiterId: req.user.id,
                        stats: updatedStats,
                    });
                } catch (statsError) {
                    // Don't fail the order update
                }
            }
        }

        // Decrease inventory for all users when order is approved (only if it wasn't already approved)
        if ((status === 'approved' || status === 'completed') && !wasAlreadyApproved) {
            try {
                await MenuItem.decreaseInventory(order.items);
            } catch (inventoryError) {
                // Don't fail the order update
            }
        }

        io.emit('order_updated', order);
        res.json(order);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Delete order
router.delete('/orders/:id', Auth.authenticate(), async (req, res) => {
    try {
        const result = await Order.deleteOrder(parseInt(req.params.id));

        io.emit('order_deleted', {id: parseInt(req.params.id)});
        res.json(result);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Waiter Routes
// Get waiters
router.get('/waiters', Auth.authenticate(), async (req, res) => {
    try {
        const waiters = await Waiter.getWaiters();
        res.json(waiters);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Statistics Routes
// Get statistics
router.get('/statistics', Auth.authenticate(), async (req, res) => {
    try {
        const statistics = await Stats.getStatistics();
        res.json(statistics);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get waiter shift statistics
router.get('/waiter-shift-stats', Auth.authenticate(), async (req, res) => {
    try {
        const stats = await Stats.getWaiterShiftStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get shift statistics (for current waiter)
router.get('/shift-stats', Auth.authenticate(), async (req, res) => {
    try {
        const stats = await Stats.getShiftStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get waiter today statistics (current shift)
router.get('/waiter-today-stats', Auth.authenticate(), async (req, res) => {
    try {
        const stats = await Stats.getWaiterTodayStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Reset waiter statistics (end shift)
router.post('/waiter-reset-stats', Auth.authenticate(), async (req, res) => {
    try {
        const result = await Stats.resetWaiterStats(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Get waiter historical statistics
router.get('/waiter-historical-stats', Auth.authenticate(), async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await Stats.getWaiterHistoricalStats(req.user.id, days);
        res.json(stats);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Logging Routes
// Log frontend errors
router.post('/logs', async (req, res) => {
    try {
        const {type, message, stack, componentStack, url, userAgent, timestamp} = req.body;

        // Assume logger is console for now
        console.error('Frontend error', {
            type,
            message,
            stack,
            componentStack,
            url,
            userAgent,
            timestamp,
        });

        res.json({success: true});
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});
// #endregion

// #region Auth Routes (from Auth model)
router.post('/login', Auth.login);
router.post('/logout', Auth.logout);

router.get('/validate-token', Auth.authenticate(), Auth.validate);
router.get('/me', Auth.authenticate(), Auth.me);
// #endregion

module.exports = router;