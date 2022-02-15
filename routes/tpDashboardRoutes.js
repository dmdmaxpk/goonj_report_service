const express = require('express');
const router = express.Router();
const controller = require('../controllers/TPDashboardController');
const cors = require('cors');

router.route('/stats', cors())
    .get(controller.getTPStats)

module.exports = router;