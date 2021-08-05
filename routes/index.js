const express = require('express');
const router = express.Router();

// Service Label
router.get('/', (req, res) => res.send("Goonj User Microservice"));

router.use('/cron',    require('./cron'));

module.exports = router;