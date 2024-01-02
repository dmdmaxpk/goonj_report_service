const container = require("../configurations/container");
const reportsService = require('../services/ReportsService');
const billingMonitoringService = require('../services/BillingMonitoringService');
const subscriptionRepository = container.resolve("subscriptionRepository");
const helper = require('../helper/helper')
const axios = require("axios");
const config = require("../config");

exports.generateDailyReport = async (req,res) =>  {
    reportsService.generateDailyReport();
    res.send("GenerateDailyReport - Executed\n");
}

exports.generateWeeklyReports = async (req,res) =>  {
    reportsService.generateWeeklyReports();
    res.send("GenerateWeeklyReport - Executed\n");
}

exports.generateMonthlyReports = async (req,res) =>  {
    // reportsService.generateMonthlyReports();
    
    reportsService.tpDashboardReportMonthly();
    res.send("GenerateMonthlyReports - Executed\n");
}

exports.generateRandomReports = async (req,res) =>  {
    reportsService.generateRandomReports(req, res);
    res.send("GenerateRandomReports - Executed\n");
}

exports.hourlyBillingReport = async (req,res) =>  {
    await billingMonitoringService.billingInLastHour();
    res.send("hourlyBillingReport - Executed");
}

exports.three_months_report = async (req,res) =>  {
    await reportsService.threeMonthsReport();
    res.send("ThreeMonthsReport - Executed");
}

exports.sendReportsEveryThreeDays = async (req,res) =>  {
    console.log("sendReportsEveryThreeDays")
    await reportsService.generateEveryThreeDaysReports();
    res.send("markRenewableUser - Executed");
}

exports.sendReportsEveryWeek = async (req,res) =>  {
    console.log("sendReportsEveryWeek")
    await reportsService.generateWeeklyReports();
    res.send("sendReportsEveryWeek - Executed");
}

exports.sendReportsEveryMonth = async (req,res) =>  {
    console.log("sendReportsEveryMonth")
    await reportsService.generateMonthlyReports();
    res.send("sendReportsEveryMonth - Executed");
}

exports.rabbitMqMonitoring = async (req,res) =>  {
    await monitorRabbitMq();
    res.send("RabbitMqMonitoring - Executed\n");
}

monitorRabbitMq = async() => {
    console.log("### monitorRabbitMq");
    let queuedCount = await subscriptionRepository.getQueuedCount();
    console.log('queuedCount: ', queuedCount);

    // if(queuedCount >= 35000){
        let messageObj = {};
        messageObj.to = ["paywall@dmdmax.com.pk"];
        // messageObj.to = ["muhammad.azam@dmdmax.com"];
        messageObj.subject = 'Current Queue Count';
        messageObj.text = `Queued subscriptions count is ${queuedCount}, please check on priority`;
        helper.sendToQueue(messageObj);
    // }else{
    //     console.log("### Current queued subscriptions are ",queuedCount);
    // }
}

exports.tpDashboard = async (req,res) =>  {
    let {startDate, endDate} = req.query;
    await reportsService.tpDashboardReport(startDate, endDate);
    res.send("TPDashboard - Executed\n");
}

exports.tpDashboardLoopCompute = async (req,res) =>  {
    let {startDate, endDate, days} = req.query;
    let from = new Date(startDate);
    let to = new Date(endDate);

    for(var i=0; i<=days; i++){

        from.setDate(from.getDate() + 1);
        from.setHours(00);
        from.setMinutes(00);
        from.setSeconds(00);
        from.setMilliseconds(00);
        
        to.setDate(to.getDate() + 1);
        to.setHours(00);
        to.setMinutes(00);
        to.setSeconds(00);
        to.setMilliseconds(00);
        
        await reportsService.tpDashboardReport(from, to);
    }
    res.send("TPDashboard Loop Compute - Executed\n");
}