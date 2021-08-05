const container = require("../configurations/container");
const reportsService = require('../services/ReportsService');
const billingMonitoringService = require('../services/BillingMonitoringService');

const subscriptionRepository = container.resolve("subscriptionRepository");

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

    await sendEmail(queuedCount);

    if(queuedCount >= 35000){
        // shoot email
        await sendEmail(queuedCount);
    }else{
        console.log("### Current queued subscriptions are ",queuedCount);
    }
}

sendEmail = async(queuedCount) => {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host: "mail.dmdmax.com.pk",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'reports@goonj.pk', // generated ethereal user
          pass: 'YiVmeCPtzJn39Mu' // generated ethereal password
        }
    });

    console.log('transporter: ', transporter);
    console.log('queuedCount: ', queuedCount);

    await transporter.sendMail({
        from: 'paywall@dmdmax.com.pk',
        to:  ["muhammad.azam@dmdmax.com.pk"],
        subject: `Current Queue Count`,
        text: `Queued subscriptions count is ${queuedCount}, please check on priority`
    });
}
