const express = require('express');
const router = express.Router();
const controller = require('../controllers/cron');

router.route('/rabbitMqMonitoring')
    .get(controller.rabbitMqMonitoring);

router.route('/generateWeeklyReport')
    .get(controller.generateWeeklyReports);    

router.route('/generateDailyReport')
    .get(controller.generateDailyReport);

router.route('/generateMonthlyReport')
    .get(controller.generateMonthlyReports);

router.route('/generateRandomReports')
    .get(controller.generateRandomReports);

router.route('/hourlyBillingReport')
    .get(controller.hourlyBillingReport);

router.route('/three_months_report').get(controller.three_months_report)

router.route('/tpDashboardStats').get(controller.tpDashboard)


module.exports = router;
