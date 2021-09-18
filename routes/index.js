const express = require('express');
const router = express.Router();

// Service Label
router.get('/', (req, res) => res.send("Goonj User Microservice"));

router.use('/cron',    require('./cron'));

router.use('/history',    require('./historyRoutes'));

router.use('/report',    require('./reportRoutes'));

module.exports = router;