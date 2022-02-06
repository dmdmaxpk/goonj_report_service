const reportsRepo = require('../repos/ReportsRepo');
const helper = require('../helper/helper');
const { three_months_report } = require('../controllers/BillingStatsController');

generateDailyReport = async() => {
    console.log("=> Generating daily reports");

    //Yesterday
    var to = new Date();
    to.setDate(to.getDate() - 1);
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);

    //Day before yesterday
    var from = new Date();

    if(from.getDate() === 1){
        from.setMonth(from.getMonth() - 1);
    }

    from.setDate(to.getDate() - 1);
    from.setHours(00);
    from.setMinutes(00);
    from.setSeconds(00);

    //Day before yesterday
    var today = new Date();
    today.setHours(00);
    today.setMinutes(00);
    today.setSeconds(00);

    
    // Revenue report
    await reportsRepo.dailyReport();

    await sleep(180*1000);
    reportsRepo.callBacksReport();

    await sleep(180*1000);
    reportsRepo.dailyReturningUsers(from, to);

    await sleep(180*1000);
    reportsRepo.dailyUnsubReport(); //

    // await sleep(120*1000);
    // reportsRepo.errorCountReport();

    await sleep(180*1000);
    reportsRepo.dailyFullAndPartialChargedUsers(); //


    await sleep(120*1000);
    reportsRepo.dailyTrialToBilledUsers(); //


    await sleep(180*1000);
    reportsRepo.dailyChannelWiseUnsub();


    await sleep(180*1000);
    reportsRepo.dailyChannelWiseTrialActivated(); //


    await sleep(180*1000);
    reportsRepo.dailyPageViews(); //

    // await sleep(120*1000);
    // affiliateReportsRepo.gdnReport(to, today);
}

generateEveryThreeDaysReports =  async() => {

}

generateWeeklyReports =  async() => {
    
    let from = new Date();
    from.setDate(from.getDate() - 8);
    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);

    var to = new Date();
    to.setDate(to.getDate() -1);
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);

    //reportsRepo.getInactiveBase(from, to);
    //await sleep(300 * 1000); // minutes sleep
    reportsRepo.getExpiredBase();

    //reportsRepo.generateUsersReportWithTrialAndBillingHistory(new Date("2020-07-01T00:00:00.000Z"), new Date("2020-07-08T00:00:00.000Z"));
}

generateMonthlyReports =  async() => {

    //First date of previous month
    var from = new Date();
    from.setDate(0);
    from.setDate(1);
    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);

    //Last day of previous month
    var to = new Date();
    to.setDate(0);
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);

    console.log("=> executing call");
    reportsRepo.getUsersNotSubscribedAfterSubscribe();

    //reportsRepo.getActiveBase(new Date("2020-02-07T00:00:00.000Z"), new Date("2020-07-17T00:00:00.000Z"))

    //reportsRepo.dailyNetAddition(from, to);
    //await sleep(180 * 1000); // 3 minutes
    //reportsRepo.avgTransactionPerCustomer(from, to);


    /*
    
    // For week wise reports
    let firstWeekFrom  = new Date('2020-07-01T00:00:00.000Z');
    let firstWeekTo  = new Date('2020-07-07T23:59:59.000Z');

    let secondWeekFrom  = new Date('2020-07-08T00:00:00.000Z');
    let secondWeekTo  = new Date('2020-07-15T23:59:59.000Z');

    let thirdWeekFrom  = new Date('2020-07-16T00:00:00.000Z');
    let thirdWeekTo  = new Date('2020-07-23T23:59:59.000Z');

    let forthWeekFrom  = new Date('2020-07-24T00:00:00.000Z');
    let forthWeekTo  = new Date('2020-07-31T23:59:59.000Z');


    let weekFromArray = [firstWeekFrom, secondWeekFrom, thirdWeekFrom, forthWeekFrom];
    let weekToArray = [firstWeekTo, secondWeekTo, thirdWeekTo, forthWeekTo];
    
    //await sleep(60 * 1000); // 1 minutes
    reportsRepo.weeklyRevenue(weekFromArray, weekToArray, ['farhan.ali@dmdmax.com']);

    await sleep(60 * 1000); //  1 minutes
    reportsRepo.weeklyTransactingCustomers(weekFromArray, weekToArray, ['farhan.ali@dmdmax.com']);*/
}

generateRandomReports =  async() => {
    //reportsRepo.getOnlySubscriberIds("app", "2020-08-01T00:00:00.000Z", "2020-09-01T00:00:00.000Z");
    // reportsRepo.generateReportForAcquisitionSourceAndNoOfTimeUserBilled();
    //reportsRepo.getNextBillingDtm();
    //reportsRepo.getReportForHeOrWifi();
    // reportsRepo.expireBaseAndBlackList();
    // reportsRepo.expireBaseAndBlackListOrCreate();
    // reportsRepo.getExpiredMsisdn();
    // reportsRepo.getDailyData();
    // reportsRepo.getWeeklyData();
    // reportsRepo.getMigrateUsers();
    // reportsRepo.computeLoggerBitratesDataMsisdnWise();
    // reportsRepo.computeLoggerTotalHoursDataMsisdnWise();
    // reportsRepo.computeDouMonthlyData();
    // reportsRepo.computeWatchHoursByViewLogs();
    // reportsRepo.computeDoubleChargeUsers();
    // reportsRepo.generateReportForAcquisitionRevenueAndSessions();
}

billingInLastHour = async() => {
    try {
        let billingCountThisHour = await billingHistoryRepo.billingInLastHour();
        console.log('billingCountThisHour',billingCountThisHour);
        if(billingCountThisHour < 50){
            // Shoot an email
            // var info = await transporter.sendMail({
            //     from: ['paywall@dmdmax.com.pk'], // sender address
            //     to:  ["paywall@dmdmax.com.pk"], // list of receivers
            //     subject: `Billing Count for this hour`, // Subject line
            //     text: `Number of billing and graced count for this hour(${new Date()}) is ${billingCountThisHour}. `, // plain text bodyday
            // });

            let messageObj = {};
            // messageObj.to = ["paywall@dmdmax.com.pk"];
            messageObj.to = ["muhammad.azam@dmdmax.com", "farhan.ali@dmdmax.com"];
            messageObj.subject = 'Billing Count for this hour';
            messageObj.text = `Number of billing and graced count for this hour(${new Date()}) is ${billingCountThisHour}. `;
            helper.sendToQueue(messageObj);

            console.log("[billingInLastHour][EmailSent][info]");
        }
    }catch(err) {
        console.log(err);
    }
}

threeMonthsReport = async() => {
    try{
        reportsRepo.getThreeMonthsData();
    }catch(e){
        console.log(e);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    generateDailyReport: generateDailyReport,
    generateEveryThreeDaysReports: generateEveryThreeDaysReports,
    generateWeeklyReports: generateWeeklyReports,
    generateMonthlyReports: generateMonthlyReports,
    generateRandomReports: generateRandomReports,
    billingInLastHour: billingInLastHour,
    threeMonthsReport: threeMonthsReport
}