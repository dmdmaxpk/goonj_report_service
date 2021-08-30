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
    reportsService.generateMonthlyReports();
    res.send("GenerateMonthlyReports - Executed\n");
}

exports.generateRandomReports = async (req,res) =>  {
    reportsService.generateRandomReports();
    res.send("GenerateRandomReports - Executed\n");
}

exports.hourlyBillingReport = async (req,res) =>  {
    await billingMonitoringService.billingInLastHour();
    res.send("hourlyBillingReport - Executed");
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

    if(queuedCount >= 35000){
        let messageObj = {};
        // messageObj.to = ["paywall@dmdmax.com.pk"];
        messageObj.to = ["muhammad.azam@dmdmax.com"];
        messageObj.subject = 'Current Queue Count';
        messageObj.text = `Queued subscriptions count is ${queuedCount}, please check on priority`;
        helper.sendToQueue(messageObj);
    }else{
        console.log("### Current queued subscriptions are ",queuedCount);
    }
}