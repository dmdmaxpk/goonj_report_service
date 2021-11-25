const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const readline = require('readline');
const FormData = require('form-data');
const nodemailer = require('nodemailer');
const  _ = require('lodash');
const container = require("../configurations/container");
const Subscription = mongoose.model('Subscription');
const BillingHistory = mongoose.model('BillingHistory');
const User = mongoose.model('User');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const billinghistoryRepo = container.resolve('billingHistoryRepository');
const subscriptionRepo = container.resolve('subscriptionRepository');

const loggerMsisdnRepo = require('../repos/LoggerMsisdnRepo');
const usersRepo = container.resolve('userRepository');
const viewLogsRepo = require('../repos/ViewLogRepo');
const pageViews = require('../controllers/PageViews');
const otpRepo = require('../repos/OTPRepo');
const config = require('../config');
const helper = require("../helper/helper");

let currentDate = null;
currentDate = getCurrentDate();

let paywallTotalBase = currentDate+"_PaywallTotalBase.csv";
let paywallTotalBaseFilePath = `./${paywallTotalBase}`;

let ActiveBase = currentDate+"_ActiveBase.csv";
let ActiveBaseFilePath = `./${ActiveBase}`;

let paywallExpiredBase = currentDate+"_PaywallExpiredBase.csv";
let paywallExpiredBaseFilePath = `./${paywallExpiredBase}`;

let paywallInActiveBase = currentDate+"_PaywallInActiveBase.csv";
let paywallInActiveBaseFilePath = `./${paywallInActiveBase}`;

let paywallRevFileName = currentDate+"_PaywallRevReport.csv";
let paywallRevFilePath = `./${paywallRevFileName}`;

let paywallUnsubReport = currentDate+"_UnsubReport.csv";
let paywallUnsubFilePath = `./${paywallUnsubReport}`;

let paywallChannelWiseUnsubReport = currentDate+"_ChannelWiseUnsub.csv";
let paywallChannelWiseUnsubReportFilePath = `./${paywallChannelWiseUnsubReport}`;

let paywallChannelWiseTrial = currentDate+"_ChannelWiseTrial.csv";
let paywallChannelWiseTrialFilePath = `./${paywallChannelWiseTrial}`;

let paywallErrorCountReport = currentDate+"_ErrorCountReport.csv";
let paywallErrorCountFilePath = `./${paywallErrorCountReport}`;

let paywallErrorCountReportBySource = currentDate+"_ErrorCountReportBySource.csv";
let paywallErrorCountBySourceFilePath = `./${paywallErrorCountReportBySource}`;

let paywallFullAndPartialChargedReport = currentDate+"_FullAndPartialCharged.csv";
let paywallFullAndPartialChargedReportFilePath = `./${paywallFullAndPartialChargedReport}`;

let paywallCallbackReport = currentDate+"_CallbackReport.csv";
let paywallCallbackFilePath = `./${paywallCallbackReport}`;

let paywallTrialToBilledUsers = currentDate+"_TrialToBilled.csv";
let paywallTrialToBilledUsersFilePath = `./${paywallTrialToBilledUsers}`;

let threeMonthData = currentDate+"_ThreeMonthsData.csv";
let threeMonthDataFilePath = `./${threeMonthData}`;

let affiliatePvs = currentDate+"_AffiliatePageViews.csv";
let affiliatePvsFilePath = `./${affiliatePvs}`;

let dailyNetAdditionCsv = currentDate+"_DailyNetAdditions.csv";
let dailyNetAdditionFilePath = `./${dailyNetAdditionCsv}`;

let findingCsv = currentDate+"_Findings.csv";
let findingCsvPath = `./${findingCsv}`;

let migrateUserCsv = currentDate+"_MigratedUsers.csv";
let migrateUserCsvPath = `./${migrateUserCsv}`;

let nextBillingDtmCsv = currentDate+"_NextBillingDtm.csv";
let nextBillingDtmFilePath = `./${nextBillingDtmCsv}`;

let usersReportWithTrialAndBillingHistory = currentDate+"_UsersReportWithTrialAndBillingHistory.csv";
let usersReportWithTrialAndBillingHistoryFilePath = `./${usersReportWithTrialAndBillingHistory}`;

let dateWiseChargingDetails = currentDate+"_DateWiseChargingDetails.csv";
let dateWiseChargingDetailsFilePath = `./${dateWiseChargingDetails}`;

let randomReport = currentDate+"_RandomReport.csv";
let randomReportFilePath = `./${randomReport}`;

let wifiOrHeReport = currentDate+"_WifiOrHe.csv";
let wifiOrHeReportFP = `./${wifiOrHeReport}`;

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const nextBillingDtmCsvWriter = createCsvWriter({
    path: nextBillingDtmFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: "next_billing",title: "Next Billing Datetime" }
    ]
});

const dateWiseChargingDetailsWriter = createCsvWriter({
    path: dateWiseChargingDetailsFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: "count",title: "Billing Count" }
    ]
});

const csvWriter = createCsvWriter({
    path: paywallRevFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'newUser', title: 'Number Verified Users'},
        {id: 'newSubscriber', title: 'New Subscribers'},
        {id: 'totalSubscribers', title: 'Total Subscribers'},
        {id: 'trials', title: 'Trials Activated'},
        {id: 'tempTotalActiveSubscribers',title: 'Total Active Subscribers'},

        {id: 'liveOnlyCount', title: 'Live Daily'},
        {id: 'liveWeeklyCount', title: 'Live Weekly'},
        {id: 'comedyOnlyCount', title: 'Comedy Daily'},
        {id: 'comedyWeeklyCount', title: 'Comedy Weekly'},

        {id: 'liveOnlyRevenue', title: 'Live Daily Revenue'},
        {id: 'liveWeeklyRevenue', title: 'Live Weekly Revenue'},
        {id: 'comedyOnlyRevenue', title: 'Comedy Daily Revenue'},
        {id: 'comedyWeeklyRevenue', title: 'Comedy Weekly Revenue'},
        {id: 'totalRevenue',title: 'Total Revenue'}

    ]
});

const dailyNetAdditionWriter = createCsvWriter({
    path: dailyNetAdditionFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'subs', title: 'Subscriptions'},
        {id: "unsubs",title: "Un-Subscriptions" },
        {id: "net",title: "Net Subscriptions" },
    ]
});

const csvReportWriter = createCsvWriter({
    path: paywallCallbackFilePath,
    header: [
        {id: 'tid', title: 'TID'},
        {id: 'mid', title: 'MID'},
        {id: "isValidUser",title: "Is Valid Telenor User" },
        {id: "isCallbAckSent",title: "IS CallBack Sent" },
        {id: 'added_dtm', title: 'User TIMESTAMP'},
        {id: 'callBackSentTime', title: 'TIMESTAMP'}
    ]
});

const findingCsvWriter = createCsvWriter({
    path: findingCsvPath,
    header: [
        {id: 'msisdn', title: 'Mobile Number'},
        {id: 'package', title: 'Package'},
        {id: 'error_reason', title: 'Error Reason'},
        {id: "added_dtm",title: "Acquired Date" }
    ]
});

const migrateUsersCsvWriter = createCsvWriter({
    path: migrateUserCsvPath,
    header: [
        {id: 'msisdn', title: 'Mobile Number'},
        {id: 'message', title: 'Message'},
    ]
});

const csvTotalBase = createCsvWriter({
    path: paywallTotalBaseFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
    ]
});

const csvExpiredBase = createCsvWriter({
    path: paywallExpiredBaseFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
    ]
});

const csvInActiveBase = createCsvWriter({
    path: paywallInActiveBaseFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
    ]
});

const ActiveBaseWriter = createCsvWriter({
    path: ActiveBaseFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
    ]
});

const csvFullAndPartialCharged = createCsvWriter({
    path: paywallFullAndPartialChargedReportFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'fully_charged_users', title: 'Fully Charged Users'},
        {id: "partially_charged_users",title: "Partially Charged Users" },
        {id: 'total', title: 'Total'}
    ]
});

const csvTrialToBilledUsers = createCsvWriter({
    path: paywallTrialToBilledUsersFilePath,
    header: [
        {id: 'trial_date', title: 'Trial Activation Date'},
        {id: 'billed_date', title: "Successfull Billing Date"},
        //{id: 'msisdn', title: 'List of MSISDNs'},
        {id: 'total', title: 'Total Count'}
    ]
});

const csvThreeMonthData = createCsvWriter({
    path: threeMonthDataFilePath,
    header: [
        {id: '_id', title: 'Sessions'},
        {id: 'subscribers', title: "Susbcribers"},
        {id: 'revenue', title: 'Revenue'}
    ]
});

const randomReportWriter = createCsvWriter({
    path: randomReportFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'subs_count', title: 'Number Of Subscriptions'},
        {id: 'acquisition_source', title: 'Acquisition Source'},
        {id: 'act_date', title: 'Activation Date'},
        {id: 'acquisition_date', title: 'Acquisition Date'},
        {id: 'affiliate_unique_transaction_id', title: 'Acquisition Transaction ID'},
        {id: 'number_of_success_charging', title: 'Number of Success Charging'},
        {id: "dou",title: "DOU" },
        {id: "source",title: "Source (Consent model)" },
    ]
});


const acqusitionRevenueReportWriter = createCsvWriter({
    path: randomReportFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'revenue', title: 'Revenue'},
        {id: 'dou', title: 'No.of Sessions'},
        {id: 'mid', title: 'Affiliate Mid'},
        {id: 'tid', title: 'Transaction Id'},
        {id: 'acqusition_timestepms', title: 'Acqusition Timestepms'}
    ]
});

const tp_billing_cycle_hours = [1,5,8,11,14,17,20,22];

const doubleChargeReport = createCsvWriter({

    path: randomReportFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'cycle_1', title: 'cycle_1'},
        {id: 'cycle_5', title: 'cycle_5'},
        {id: 'cycle_8', title: 'cycle_8'},
        {id: 'cycle_11', title: 'cycle_11'},
        {id: 'cycle_14', title: 'cycle_14'},
        {id: 'cycle_17', title: 'cycle_17'},
        {id: "cycle_20",title: "cycle_20" },
        {id: "cycle_22",title: "cycle_22" },
    ]
});

const loggerMsisdnWiseMonthlyReportWriter = createCsvWriter({
    path: randomReportFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'month', title: 'Month'},
        {id: 'watchTime', title: 'Watch Time (SEC)'}
    ]
});

const loggerMsisdnWiseReportWriter = createCsvWriter({
    path: randomReportFilePath,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'watchTime', title: 'Watch Time (SEC)'}
    ]
});

const wifiOrHeReportWriter = createCsvWriter({
    path: wifiOrHeReportFP,
    header: [
        {id: 'msisdn', title: 'Msisdn'},
        {id: 'source', title: 'Source'}
    ]
});

const csvAffiliatePvs = createCsvWriter({
    path: affiliatePvsFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'source',title: "Source"},
        {id: 'mid',title: "MID"},
        {id: 'count', title: "Page Views"},
    ]
});

const usersReportWithTrialAndBillingHistoryWriter = createCsvWriter({
    path: usersReportWithTrialAndBillingHistoryFilePath,
    header: [
        {id: 'mid', title: 'Mid'},
        {id: 'user_id',title: "Auto Generated Id"},
        {id: 'code',title: "Code"},
        {id: 'success_transactions', title: "Success Transactions"},
        {id: 'amount', title: "Amount"},
    ]
});

var transporter = nodemailer.createTransport({
    host: "mail.dmdmax.com.pk",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'reports@goonj.pk', // generated ethereal user
      pass: 'YiVmeCPtzJn39Mu' // generated ethereal password
    }
});

const errorCountReportBySource = createCsvWriter({
    path: paywallErrorCountBySourceFilePath,
    header: [
        {id: 'source', title: 'Source'},
        {id: 'errorMessage', title: 'Error Message'},
        {id: 'errorCode', title: 'Error Code'},
        {id: "count",title: "Error Count" }
    ]
});

const errorCountReportWriter = createCsvWriter({
    path: paywallErrorCountFilePath,
    header: [
        {id: 'errorMessage', title: 'Error Message'},
        {id: 'errorCode', title: 'Error Code'},
        {id: "count",title: "Error Count" }
    ]
});

const dailyUnsubReportWriter = createCsvWriter({
    path: paywallUnsubFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: "count",title: "Unsubscribe Count" },
        {id: "source",title: "Source" }
    ]
});

const dailyChannelWiseUnsubWriter = createCsvWriter({
    path: paywallChannelWiseUnsubReportFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'app', title: 'App'},
        {id: 'web', title: 'Web'},
        {id: 'sms', title: 'Sms'},
        {id: 'cc', title: 'Customer Care'},
        {id: 'cp', title: 'Customer Portal'},
        {id: 'expired', title: 'Expired By System'},
        {id: "total",title: "Total" }
    ]
});

const dailyChannelWiseTrialWriter = createCsvWriter({
    path: paywallChannelWiseTrialFilePath,
    header: [
        {id: 'date', title: 'Date'},
        {id: 'app', title: 'App'},
        {id: 'web', title: 'Web'},
        {id: 'HE', title: 'Affiliate'},
        {id: "total",title: "Total" }
    ]
});


function isDatePresent(array, dateToFind) {
    const result = array.find(o => new Date(o.date).getTime() === new Date(dateToFind).getTime());
    return result;
}

function isDataPresent(array, user_id) {
    const result = array.find(o => o.user_id === user_id);
    return result;
}

function getViewLogs(user_id){
    return new Promise(async(resolve, reject) => {
        try{
            let viewLog = await viewLogsRepo.getLatestViewLog(user_id);
            if(viewLog){
                resolve(viewLog);
            }else{
                reject("Not found");
            }
        }catch(err){
            reject(err);
        }
    });
}

function getCurrentDate(){
    var dateObj = new Date();
    var month = dateObj.getMonth() + 1; //months from 1-12
    var day = dateObj.getDate();
    var year = dateObj.getFullYear();
    let newdate = day + "-" + month + "-" + year;
    return newdate;
}

uploadFileAtS3 = async (file) => {
    return new Promise(function(resolve, reject) {
        let formData = new FormData();
        formData.append('file', fs.createReadStream('./' +file), { filename: file });
        axios({
            method: 'post',
            url: config.goonj_core_baseurl + '/upload/s3',
            headers: formData.getHeaders(),
            data: formData,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        }).then(function(response){
            console.log('response.data: ', response.data);
            resolve(response.data);
        }).catch(function(err){
            console.log('err: ', err);
            reject(err);
        });
    });
}

computeDouMonthlyData = async() => {
    console.log("=> computeDouMonthlyData");

    let finalResult = [];
    try{
        let startDate = '2021-08-01T00:00:00.000Z';
        let endDate = '2021-08-01T00:59:59.000Z';
        let successfulCharged = await billinghistoryRepo.getSuccessfulChargedUsers(startDate, endDate);
        console.log('successfulCharged: ', successfulCharged, successfulCharged.length);

        if (successfulCharged.length > 0 ){
            let record;
            for(let i = 0; i < successfulCharged.length; i++){
                record = successfulCharged[i];
                console.log('user_id: ', record.user_id);

                let user = await usersRepo.getUserById(record.user_id);
                if (user){
                    let singObject = {};
                    singObject.msisdn = user.msisdn;
                    singObject.source = user.source;

                    let viewLogsData = await viewLogsRepo.getDaysOfUseUnique(record.user_id, '2021-01-01T00:00:00.000Z', '2021-01-31T23:59:59.000Z');
                    if (!viewLogsData || viewLogsData.length === 0)
                        singObject.dou = 0;
                    else{
                        viewLogsData = viewLogsData[0];
                        singObject.dou = viewLogsData.dou;
                    }

                    finalResult.push(singObject);
                    console.log("### Done ", i);
                }
            }
        }

        console.log("### Finally: ", finalResult.length);

        if (finalResult.length > 0){

            console.log("### Sending email");

            await loggerMsisdnWiseMonthlyReportWriter.writeRecords(finalResult);
            console.log("loggerMsisdnWiseMonthlyReportWriter: ", loggerMsisdnWiseMonthlyReportWriter);

            let messageObj = {}, path = null;
            messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
            messageObj.subject = 'Complaint Data';
            messageObj.text = `This report contains the details of msisdns being sent us over email from Telenor`;
            messageObj.attachments = {
                filename: randomReport,
                path: path
            };

            let uploadRes = await uploadFileAtS3(randomReport);
            console.log("uploadRes: ", uploadRes);
            if (uploadRes.status) {
                messageObj.attachments.path = uploadRes.data.Location;
                helper.sendToQueue(messageObj);
            }

            fs.unlink(randomReportFilePath,function(err,data) {
                if (err) {
                    console.log("=> File not deleted[randomReportFilePath]");
                }
                console.log("=> File deleted [randomReportFilePath]");
            });
        }
    }catch(e){
        console.log("### error - ", e);
    }
}

getExpiredMsisdn = async() => {
    console.log("=> getExpiredMsisdn");
    let finalResult = [];

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        let newData;
        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){
                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                if(!user){
                    finalResult.push(inputData[i]);

                    newData = inputData[i] + '\n';
                    fs.appendFile('expired_msisdn.txt', newData, (err) => {
                        if (err)
                            console.log('Error durring write in file: ', err);

                        console.log('Write in File - successfor - msisdn: ', i, ' - ', newData);
                    });
                    console.log("### Expired User - msisdn: ", i, ' - ', newData);
                }else{
                    console.log("### User found - msisdn: ", i, ' - ', inputData[i]);
                }
            }else{
                console.log("### Invalid number or number length : ", inputData[i]);
            }
        }


        console.log("###  [randomReport][getExpiredMsisdn]", finalResult.length);
        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

getThreeMonthsData = async() => {
    console.log("#@# getThreeMonthsData");

    try{
        let finalResult = await billinghistoryRepo.getThreeMonthsData();
        console.log('#@# Final result: ', finalResult);

        if(finalResult.length > 0){
            console.log("#@# Sending email");
            try {
                await csvThreeMonthData.writeRecords(finalResult);
                let messageObj = {}, path = null;
                messageObj.to = ["muhammad.azam@dmdmax.com","farhan.ali@dmdmax.com", "usama.shamim@dmdmax.com"];
                messageObj.subject = '90 Days Data';
                messageObj.text = `90 days data requested by telenor`;
                messageObj.attachments = {filename: threeMonthDataFilePath, path: path};

                let uploadRes = await uploadFileAtS3(threeMonthDataFilePath);
                console.log("#@# uploadRes: ", uploadRes);
                if (uploadRes.status) {
                    messageObj.attachments.path = uploadRes.data.Location;
                    helper.sendToQueue(messageObj);
                }

                fs.unlink(threeMonthDataFilePath,function(err,data) {
                    if (err) {
                        console.log("#@# File not deleted[findingCsvPath]");
                    }
                    console.log("#@# File deleted [findingCsvPath]");
                });
                console.log("#@# Sending email - info:");
            }catch (err) {
                console.log("#@# Sending email - error - ", err);
            }
        }else{
            console.log("#@# finalResult is empty");
        }
    }catch(e){
        console.log("#@# error - ", e);
    }
}

getDailyData = async() => {
    let mPackage = 'QDfC';
    console.log("### QDfC");
    let finalResult = [];
    try{
        let count = 0;
        let successUsers = await billinghistoryRepo.getSuccessfullChargedUsers(mPackage);
        console.log('### Success users QDfC - : ', successUsers.length);

        for(i = 0; i < successUsers.length; i++){
            try{
                console.log("### QDfC: "+i);
                let record = await billinghistoryRepo.getUnsuccessfullChargedUsers(successUsers[i].user_id, mPackage);
                if(!record){
                    count++;
                    console.log("### count QDfC: "+count);
                    let user = await usersRepo.getUserById(successUsers[i].user_id);
                    let lastHistory = await billinghistoryRepo.getLastHistory(successUsers[i].user_id, mPackage);

                    let newObj = {};
                    newObj.msisdn = user.msisdn;
                    newObj.added_dtm = user.added_dtm;
                    newObj.package = 'Live Daily';
                    newObj.error_reason = lastHistory.length > 0 ? lastHistory[0].operator_response.errorMessage : '';
                    finalResult.push(newObj);
                }
            }catch(e){
                console.log("### QDfC", e);
            }
        }

        console.log('### Final Result - length - QDfC : ', finalResult);

        if(finalResult.length > 0){
            console.log("### Sending email - QDfC");
            try {
                await findingCsvWriter.writeRecords(finalResult);
                let messageObj = {}, path = null;
                // messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
                messageObj.to = ["muhammad.azam@dmdmax.com","farhan.ali@dmdmax.com"];
                messageObj.subject = 'Findings 24th March 2021 - Daily Package';
                messageObj.text = `Findings has been attached, please find attachment`;
                messageObj.attachments = {
                    filename: findingCsv,
                    path: path
                };

                let uploadRes = await uploadFileAtS3(findingCsv);
                console.log("uploadRes: ", uploadRes);
                if (uploadRes.status) {
                    messageObj.attachments.path = uploadRes.data.Location;
                    helper.sendToQueue(messageObj);
                }

                // let info = await transporter.sendMail({
                //     from: 'paywall@dmdmax.com.pk',
                //     to:  ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com"],
                //     subject: `Findings 24th March 2021 - Daily Package`,
                //     text: `Findings has been attached, please find attachment`,
                //     attachments:[
                //         {
                //             filename: findingCsv,
                //             path: findingCsvPath
                //         }
                //     ]
                // });

                fs.unlink(findingCsvPath,function(err,data) {
                    if (err) {
                        console.log("=> File not deleted[findingCsvPath]");
                    }
                    console.log("=> File deleted [findingCsvPath]");
                });
                console.log("### Sending email - info: ", info);
            }catch (err) {
                console.log("### Sending email - error - ", err);
            }
        }

    }catch(e){
        console.log("### error - ", e);
    }
}

getWeeklyData = async() => {
    let mPackage = 'QDfG';
    console.log("### QDfG");
    let finalResult = [];
    try{
        let count = 0;
        let successUsers = await billinghistoryRepo.getSuccessfullChargedUsers(mPackage);
        console.log('### Success users - QDfG- : ', successUsers.length);

        for(i = 0; i < successUsers.length; i++){
            try{
                console.log("### QDfG: "+i);
                let record = await billinghistoryRepo.getUnsuccessfullChargedUsers(successUsers[i].user_id, mPackage);
                if(!record){
                    count++;
                    console.log("### QDfG count: "+count);
                    let user = await usersRepo.getUserById(successUsers[i].user_id);
                    let lastHistory = await billinghistoryRepo.getLastHistory(successUsers[i].user_id, mPackage);

                    let newObj = {};
                    newObj.msisdn = user.msisdn;
                    newObj.added_dtm = user.added_dtm;
                    newObj.package = 'Live Weekly';
                    newObj.error_reason = lastHistory.length > 0 ? lastHistory[0].operator_response.errorMessage : '';
                    finalResult.push(newObj);
                }
            }catch(e){
                console.log("### QDfG", e);
            }
        }

        console.log('### Final Result - length - QDfG : ', finalResult);

        if(finalResult.length > 0){
            console.log("### Sending email - QDfG");
            try {
                await findingCsvWriter.writeRecords(finalResult);
                let messageObj = {}, path = null;
                messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
                // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
                messageObj.subject = 'Findings 24th March 2021 - Weekly Package';
                messageObj.text = `Findings has been attached, please find attachment`;
                messageObj.attachments = {
                    filename: findingCsv,
                    path: path
                };

                let uploadRes = await uploadFileAtS3(findingCsv);
                console.log("uploadRes: ", uploadRes);
                if (uploadRes.status) {
                    messageObj.attachments.path = uploadRes.data.Location;
                    helper.sendToQueue(messageObj);
                }

                // let info = await transporter.sendMail({
                //     from: 'paywall@dmdmax.com.pk',
                //     to:  ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com"],
                //     subject: `Findings 24th March 2021 - Weekly Package`,
                //     text: `Findings has been attached, please find attachment`,
                //     attachments:[
                //         {
                //             filename: findingCsv,
                //             path: findingCsvPath
                //         }
                //     ]
                // });

                fs.unlink(findingCsvPath,function(err,data) {
                    if (err) {
                        console.log("=> File not deleted[findingCsvPath]");
                    }
                    console.log("=> File deleted [findingCsvPath]");
                });

                console.log("### Sending email - info: ", info);
            }catch (err) {
                console.log("### Sending email - error - ", err);
            }
        }

    }catch(e){
        console.log("### error - ", e);
    }
}

getMigrateUsers = async() => {
    console.log("### getMigrateUsers - ");
    let finalResult = [];
    try{
        let from = new Date("2021-02-01T00:00:00.000Z");
        let to = new Date("2021-03-25T00:00:00.000Z");
        let migratedUsers = await billinghistoryRepo.getMigratedUsers(from, to);
        console.log('### migratedUsers users: ', migratedUsers.length);


        for(let i = 0; i < migratedUsers.length; i++){
            let user = await usersRepo.getUserById(migratedUsers[i]._id);

            newObj = {};
            newObj.msisdn = user.msisdn;
            newObj.message = 'The subscriber does not exist or the customer that the subscriber belongs to is being migrated. Please check.';
            finalResult.push(newObj);
            console.log('### count: ', finalResult.length, i+1);

        }

        console.log('### Final Result - length : ', finalResult.length);


        if(finalResult.length > 0){
            console.log("### Sending email");
            try {
                await migrateUsersCsvWriter.writeRecords(finalResult);
                let messageObj = {}, path = null;
                messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
                // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
                messageObj.subject = 'Last 45 day migrated users';
                messageObj.text = `Migrated Users has been attached, please find attachment`;
                messageObj.attachments = {
                    filename: migrateUserCsv,
                    path: path
                };

                let uploadRes = await uploadFileAtS3(migrateUserCsv);
                console.log("uploadRes: ", uploadRes);
                if (uploadRes.status) {
                    messageObj.attachments.path = uploadRes.data.Location;
                    helper.sendToQueue(messageObj);
                }


                // let info = await transporter.sendMail({
                //     from: 'paywall@dmdmax.com.pk',
                //     to:  ["farhan.ali@dmdmax.com"],
                //     subject: `Last 45 day migrated users`,
                //     text: `Migrated Users has been attached, please find attachment`,
                //     attachments:[
                //         {
                //             filename: migrateUserCsv,
                //             path: migrateUserCsvPath
                //         }
                //     ]
                // });

                fs.unlink(migrateUserCsvPath,function(err,data) {
                    if (err) {
                        console.log("=> File not deleted[migrateUserCsvPath]");
                    }
                    console.log("=> File deleted [migrateUserCsvPath]");
                });
                console.log("### Sending email - info: ");
            }catch (err) {
                console.log("### Sending email - error - ", err);
            }
        }

    }catch(e){
        console.log("### error - ", e);
    }
}

expireBaseAndBlackList = async() => {
    console.log("### expireBaseAndBlackList");

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);
        let blacklistIds = [];
        let finalResult = [];
        for(let i = 0; i < inputData.length; i++){
            let singObject = {}
            if(inputData[i] && inputData[i].length === 11){
                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                let dou = await viewLogsRepo.getDaysOfUseTotal(user._id);
                if(user){
                    if(dou.length > 0 && dou[0].douTotal > 2){
                        console.log("DOU's more than 2")      
                        singObject.msisdn = inputData[i];
                        singObject.dou = dou[0].douTotal;
                    }
                    else{
                        console.log("DOU's less than or equal to 2")      
                        let unSubObject = {};
                        unSubObject.transaction_id = 'random-transaction-id';
                        unSubObject.msisdn = user.msisdn;
                        unSubObject.source = 'tp-on-demand-via-email';
                        
                        axios.post('http://localhost:3004/subscription/unsubscribe', unSubObject);
                        console.log('### Axios call sent for msisdn ', user.msisdn);
                        blacklistIds.push(user._id);
                    }
                }else{
                    console.log("### No user found for", inputData[i]);
                }
            }else{
                console.log("### Invalid number or number length");
            }
            finalResult.push(singObject)
        }

        let blacklistResult = await usersRepo.blacklistMany(blacklistIds);
        console.log("### Blacklisted: ", blacklistResult, blacklistIds);

        console.log("### Sending email", finalResult);
        
        await acqusitionRevenueReportWriter.writeRecords(finalResult);
        let messageObj = {};
        messageObj.to = ["taha@dmdmax.com"];
        messageObj.subject = `MSISDN purged and Blacklisted`,
        messageObj.text =  `This report contains the details of msisdns sent us over email from Telenor`
        messageObj.attachments = {
            filename: randomReport,
            path: null
        };

        let uploadRes = await uploadFileAtS3(randomReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        console.log("###  [randomReport][emailSent]");
        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
        
    }catch(e){
        console.log("### error - ", e);
    }
}

expireBaseAndBlackListOrCreate = async() => {
    console.log("### expireBaseAndBlackListOrCreate");

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);
        let blacklistIds = [];
        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){
                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                if(user){
                    let unSubObject = {};
                    unSubObject.transaction_id = 'random-transaction-id';
                    unSubObject.msisdn = user.msisdn;
                    unSubObject.source = 'tp-on-demand-via-email';

                    axios.post('http://127.0.0.1:5000/payment/sms-unsub', unSubObject);
                    console.log('### Axios call send for msisdn ', user.msisdn);
                    blacklistIds.push(user._id);
                }else{
                    console.log("### No user found for ", inputData[i]);
                    console.log("### Create and black list ", inputData[i]);
                    let userObj = {};
                    userObj.msisdn = inputData[i];
                    userObj.source = 'system';
                    userObj.operator = 'telenor';
                    userObj.is_black_listed = true;

                    usersRepo.createUser(userObj);
                }
            }else{
                console.log("### Invalid number or number length");
            }
        }

        let blacklistResult = await usersRepo.blacklistMany(blacklistIds);
        console.log("### Blacklisted: ", blacklistResult);
    }catch(e){
        console.log("### error - ", e);
    }
}

getNextBillingDtm = async() => {
    console.log("### getNextBillingDtm");
    let finalResult = [];

    try{

        let subscriptions = await subscriptionRepo.getComedyDailySubscriptions();
        console.log("### Input Data Length: ", subscriptions.length);
        for(let i = 0; i < subscriptions.length; i++){
            let user = await usersRepo.getUserBySubscriptionId(subscriptions[i]._id);

            if(user){
                let singleObject = {};
                singleObject.msisdn = user.msisdn;
                singleObject.next_billing = subscriptions[i].next_billing_timestamp;
                finalResult.push(singleObject);
            }
        }

        console.log("### Sending email");
        await nextBillingDtmCsvWriter.writeRecords(finalResult);
        let messageObj = {}, path = null;
        messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Msisdns & Next Billing Timestamp - Comedy Daily';
        messageObj.text = `This report contains the details of msisdns & next billing timestamp for comedy daily`;
        messageObj.attachments = {
            filename: nextBillingDtmCsv,
            path: path
        };

        let uploadRes = await uploadFileAtS3(nextBillingDtmCsv);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["farhan.ali@dmdmax.com"],
        //     subject: `Msisdns & Next Billing Timestamp - Comedy Daily`, // Subject line
        //     text: `This report contains the details of msisdns & next billing timestamp for comedy daily`,
        //     attachments:[
        //         {
        //             filename: nextBillingDtmCsv,
        //             path: nextBillingDtmFilePath
        //         }
        //     ]
        // });

        console.log("###  [nextBillingDtmFilePath][emailSent]");
        fs.unlink(nextBillingDtmFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[nextBillingDtmFilePath]");
            }
            console.log("###  File deleted [nextBillingDtmFilePath]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

getReportForHeOrWifi = async() => {
    console.log("=> getReportForHeOrWifi");
    let finalResult = [];

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){
                console.log("### Msisdn:", inputData[i]);

                let singObject = {
                    msisdn: inputData[i]
                }

                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                if(user){
                    let otp = await otpRepo.getOtp(inputData[i]);
                    if(otp && otp.verified === true){
                        //OTP verified
                        singObject.source = "otp";
                    }else{
                        singObject.source = "he";
                    }
                    finalResult.push(singObject);
                }else{
                    console.log("### No user found for", inputData[i]);
                }
            }else{
                console.log("### Invalid number or number length");
            }
        }

        console.log("### Sending email");
        await wifiOrHeReportWriter.writeRecords(finalResult);
        let messageObj = {}, path = null;
        messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'OTP or HE';
        messageObj.text = `This report contains the details of msisdns being sent us over email from Telenor`;
        messageObj.attachments = {
            filename: wifiOrHeReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(wifiOrHeReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["farhan.ali@dmdmax.com"],
        //     subject: `OTP or HE`, // Subject line
        //     text: `This report contains the details of msisdns being sent us over email from Zara`,
        //     attachments:[
        //         {
        //             filename: wifiOrHeReport,
        //             path: wifiOrHeReportFP
        //         }
        //     ]
        // });

        console.log("###  [randomReport][emailSent]");
        fs.unlink(wifiOrHeReportFP,function(err,data) {
            if (err) {
                console.log("###  File not deleted[wifiOrHeReportFP]");
            }
            console.log("###  File deleted [wifiOrHeReportFP]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

readFileSync = async (jsonPath) => {
    return new Promise((resolve, reject) => {
        try{
            const readInterface = readline.createInterface({
                input: fs.createReadStream(jsonPath)
            });
            let inputData = [];
            let counter = 0;
            readInterface.on('line', function(line) {
                if(line.startsWith("92")){
                    line = line.replace('92', '0');
                }else if(line.startsWith("3")){
                    line = "0" + line;
                }

                inputData.push(line);
                counter += 1;
                console.log("### read", counter);
            });

            readInterface.on('close', function(line) {
                resolve(inputData);
            });
        }catch(e){
            reject(e);
        }
    });
}

readFileSyncCustom = async (jsonPath) => {
    return new Promise((resolve, reject) => {
        try{
            const readInterface = readline.createInterface({
                input: fs.createReadStream(jsonPath)
            });
            let inputData = [];
            let counter = 0;
            readInterface.on('line', function(line) {
                let singleLine = line.split('\t');
                let num = singleLine[0];
                let date = singleLine[1]
                if(num.startsWith("92")){
                    num = num.replace('92', '0');
                }else if(num.startsWith("3")){
                    num = "0" + num;
                }

                inputData.push([num, date]);
                counter += 1;
                // console.log("### read", counter);
            });

            readInterface.on('close', function(line) {
                resolve(inputData);
            });
        }catch(e){
            reject(e);
        }
    });
}

dailyReport = async(mode = 'prod') => {

    let resultToWriteToCsv= [];

    console.log("=> dailyReport");
    let today = new Date();
    let myToday = new Date(today.getFullYear(),today.getMonth(),today.getDate(),0,0,0);

    let dayBeforeYesterday = new Date(today.getFullYear(),today.getMonth(),today.getDate(),0,0,0);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    // let reportStartDate = new Date("2020-09-15T00:00:00.672Z");

    let reportStartDate  = _.clone(today);
    reportStartDate.setDate(reportStartDate.getDate() - 30);
    reportStartDate.setHours(0, 0, 0);

    // let myToday = new Date("2021-10-01T00:00:00.000Z");
    // let reportStartDate = new Date("2021-09-01T00:00:00.000Z");

    console.log("=> myToday: ", myToday);
    console.log("=> reportStartDate: ", reportStartDate);

    try{
        let susbcriberStats = await Subscription.aggregate([
            {
                "$match":
                    {
                        "added_dtm": { "$gte": reportStartDate ,$lt: myToday  },
                        "active": true
                    }
            },
            {$group: {_id: {"day": {"$dayOfMonth" : "$added_dtm"}, "month": { "$month" : "$added_dtm" },"year":{ $year: "$added_dtm" } } , count:{ $sum: 1 } } },
            {$project: {  "date":{"$dateFromParts":{ year: "$_id.year","month":"$_id.month","day":"$_id.day" }}, "count": "$count",_id:-1 }} ,
            { $sort: {"date": -1}}
        ]);

        console.log("=> dailyReport 1: ", susbcriberStats);

        let subscription_status_stats = await Subscription.aggregate([
            {
                "$match":
                    {
                        "added_dtm": { "$gte": reportStartDate ,$lt: myToday  },
                        active:true
                    }
            },
            {$group: {_id: {subscription_status: "$subscription_status" } , count:{ $sum: 1 } } },
            {$project: {  "count": "$count",_id: 1 }} ,
            { $sort: {"date": -1}}
        ]);

        console.log("=> dailyReport 2: ", subscription_status_stats);

        let totalActiveSubscribers = subscription_status_stats.reduce((accum,elem) => {
            if (elem._id.subscription_status === "trial" || elem._id.subscription_status === "graced" || elem._id.subscription_status === "billed") {
                return accum = accum + elem.count;
            }
            return accum;
        },0);

        console.log("=> dailyReport 3 : ", totalActiveSubscribers);

        let userStats = await User.aggregate([
            {
                "$match":
                    {
                        "added_dtm": { "$gte": reportStartDate ,$lt: myToday  },
                        active:true,
                        operator:"telenor"
                    }
            },
            {$group: {_id: {"day": {"$dayOfMonth" : "$added_dtm"}, "month": { "$month" : "$added_dtm" },
                        "year":{ $year: "$added_dtm" }} , count:{ $sum: 1 } } },
            {$project: {  "date":{"$dateFromParts":{ year: "$_id.year","month":"$_id.month","day":"$_id.day" }}, "count": "$count",_id:-1 }},
            {$sort: {"date": -1}}
        ]);

        console.log("=> dailyReport 4: ", userStats);

        let totalUserStats = await User.countDocuments({ "added_dtm": { "$gte": reportStartDate ,$lt: myToday  },active:true } );
        console.log("=> dailyReport 4.1: ", totalUserStats);
        let totalSubscriberStats = await Subscription.countDocuments({ "added_dtm": { "$gte": reportStartDate ,$lt: myToday  },active:true } );
        console.log("=> dailyReport 4.2 - ", totalSubscriberStats);

        let totalExpiredCount = 0; /*await BillingHistory.countDocuments({"billing_dtm": { "$gte": reportStartDate ,$lt: myToday  },billing_status: "expired"} );
        console.log("=> dailyReport 5 - ", totalExpiredCount);*/

        let billingStats = await BillingHistory.aggregate([
            { $match: { "billing_status": "Success", "billing_dtm": { "$gte": reportStartDate ,$lt: myToday  } } },
            {$group: {_id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                        "year":{ $year: "$billing_dtm" },billing_status: "$billing_status",package_id: "$package_id" } , revenue:{ $sum: "$price" },count:{$sum: 1} } },
            {$project: {  "date":{"$dateFromParts":{ year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                    "revenue": "$revenue","count":"$count",_id:-1 }},{$sort: {"date": -1}}
        ]);

        console.log("=> dailyReport 6: ", billingStats);

        let trialStats = await BillingHistory.aggregate([
            { $match: { "billing_status": "trial","billing_dtm": { "$gte": reportStartDate ,$lt: myToday  }  } },
            {$group: {_id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                        "year":{ $year: "$billing_dtm" } } , trials:{ $sum: 1 } } },
            {$project: {  "date":{"$dateFromParts":{ year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                    "trials": "$trials",_id:-1 }},{$sort: {"date": -1}}
        ]);

        console.log("=> dailyReport 7: ", trialStats);

        let resultToWrite = {};
        userStats.forEach(userStat => {
            if(userStat.date){
                resultToWrite[userStat.date.toDateString()] =  {};
            }
        });

        console.log("=> dailyReport 8: ", userStats);

        let totalUsers = totalUserStats;
        userStats.forEach(userStat => {
            if(userStat.date){
                resultToWrite[userStat.date.toDateString()]['newUser'] = userStat.count;
                totalUsers = totalUsers - userStat.count;
                resultToWrite[userStat.date.toDateString()]['totalUsers'] = totalUsers;
            }
        });

        console.log("=> dailyReport 9: ", userStats);

        var totalSubscriber = totalSubscriberStats;
        susbcriberStats.forEach(subsc => {
            if(subsc.date){
                resultToWrite[subsc.date.toDateString()]['newSubscriber'] = subsc.count;
                totalSubscriber = totalSubscriber - subsc.count;
                resultToWrite[subsc.date.toDateString()]['totalSubscribers'] = totalSubscriber;
            }
        });

        console.log("=> dailyReport 10: ", susbcriberStats);

        let totalExpiredCountt = totalExpiredCount;

        billingStats.forEach(billingHistor => {
            // console.log(billingHistor);
            if(resultToWrite[billingHistor.date.toDateString()] && billingHistor._id["billing_status"] === "Success") {
                console.log("billingHistor",billingHistor);
                if (billingHistor._id.package_id === "QDfC") {
                    resultToWrite[billingHistor.date.toDateString()]['revenue-liveonly'] = billingHistor.revenue;
                    resultToWrite[billingHistor.date.toDateString()]['users-billed-liveonly'] = billingHistor.count;
                }
                if (billingHistor._id.package_id === "QDfG") {
                    resultToWrite[billingHistor.date.toDateString()]['revenue-liveweekly'] = billingHistor.revenue;
                    resultToWrite[billingHistor.date.toDateString()]['users-billed-liveweekly'] = billingHistor.count;
                }
                if (billingHistor._id.package_id === "QDfH") {
                    resultToWrite[billingHistor.date.toDateString()]['revenue-comedyonly'] = billingHistor.revenue;
                    resultToWrite[billingHistor.date.toDateString()]['users-billed-comedyonly'] = billingHistor.count;
                }
                if (billingHistor._id.package_id === "QDfI") {
                    resultToWrite[billingHistor.date.toDateString()]['revenue-comedyweekly'] = billingHistor.revenue;
                    resultToWrite[billingHistor.date.toDateString()]['users-billed-comedyweekly'] = billingHistor.count;
                }
            } else if (resultToWrite[billingHistor.date.toDateString()] && billingHistor._id["billing_status"] === "expired")  {
                console.log("[dailyReport]expired On the day",billingHistor.count);
                console.log("[dailyReport]date",billingHistor.date.toDateString());
                totalExpiredCountt = totalExpiredCountt - billingHistor.count;
                console.log("[dailyReport]totalExpiredCountt",totalExpiredCountt);
                resultToWrite[billingHistor.date.toDateString()]['users_expired'] = billingHistor.count;
                resultToWrite[billingHistor.date.toDateString()]['users_expired_till_today'] = totalExpiredCountt;
            }
        });
        console.log("=> dailyReport 11");

        trialStats.forEach(trialStat => {
            if(resultToWrite[trialStat.date.toDateString()]) {
                resultToWrite[trialStat.date.toDateString()]['trials'] = trialStat.trials;
            }
        });

        console.log("=> dailyReport 12");

        // console.log("myDate",dayBeforeYesterday.toDateString());
        // console.log("myToday",resultToWrite[dayBeforeYesterday.toDateString()]);
        resultToWrite[dayBeforeYesterday.toDateString()]["tempTotalActiveSubscribers"] = totalActiveSubscribers;

        for (res in resultToWrite) {
            let liveOnlyRevenue = (resultToWrite[res]["revenue-liveonly"])?resultToWrite[res]["revenue-liveonly"]:0;
            let liveWeeklyRevenue = (resultToWrite[res]["revenue-liveweekly"])?resultToWrite[res]["revenue-liveweekly"]:0;
            let comedyOnlyRevenue = (resultToWrite[res]["revenue-comedyonly"])?resultToWrite[res]["revenue-comedyonly"]:0 ;
            let comedyWeeklyRevenue = (resultToWrite[res]["revenue-comedyweekly"])?resultToWrite[res]["revenue-comedyweekly"]:0 ;

            let totalRevenue = liveOnlyRevenue + liveWeeklyRevenue + comedyOnlyRevenue + comedyWeeklyRevenue;

            let temp = {date: res, newUser: resultToWrite[res].newUser , newSubscriber: resultToWrite[res].newSubscriber,
                liveOnlyCount: resultToWrite[res]["users-billed-liveonly"],
                liveOnlyRevenue: liveOnlyRevenue,

                liveWeeklyCount: resultToWrite[res]["users-billed-liveweekly"],
                liveWeeklyRevenue: liveWeeklyRevenue,

                comedyOnlyCount: resultToWrite[res]["users-billed-comedyonly"],
                comedyOnlyRevenue: comedyOnlyRevenue,

                comedyWeeklyCount: resultToWrite[res]["users-billed-comedyweekly"],
                comedyWeeklyRevenue: comedyWeeklyRevenue,

                users_billed: resultToWrite[res].users_billed, trials: resultToWrite[res].trials,tempTotalActiveSubscribers: (resultToWrite[res]["tempTotalActiveSubscribers"])?resultToWrite[res]["tempTotalActiveSubscribers"]:"",
                totalUsers : resultToWrite[res].totalUsers, totalSubscribers: resultToWrite[res].totalSubscribers,
                totalActiveSubscribers : (resultToWrite[res].totalSubscribers - resultToWrite[res].users_expired_till_today < 0)? 0 : resultToWrite[res].totalSubscribers - resultToWrite[res].users_expired_till_today,
                totalRevenue:  totalRevenue
            }
            resultToWriteToCsv.push(temp);
        }

        console.log("=> dailyReport 13");

    }
    catch(err){
        console.log("=> catch ", err);
    }

    try {
        csvWriter.writeRecords(resultToWriteToCsv).then(async (data) => {

            let messageObj = {}, path = null;
            messageObj.to = ["yasir.rafique@dmdmax.com","paywall@dmdmax.com.pk","mikaeel@dmdmax.com", "fahad.shabbir@ideationtec.com","ceo@ideationtec.com","asad@ideationtec.com","usama.abbasi@ideationtec.com","wasif@dmdmax.com","muhammad.azam@dmdmax.com"];
            // messageObj.to = ["farhan.ali@dmdmax.com", "muhammad.azam@dmdmax.com", "usama.shamim@dmdmax.com", "nauman@dmdmax.com"];
            messageObj.subject = 'Paywall Report';
            messageObj.text = `PFA some basic stats for Paywall from ${(new Date(reportStartDate)).toDateString()} to ${(new Date(myToday)).toDateString()}`;
            messageObj.attachments = {
                filename: paywallRevFileName,
                path: path
            };

            let uploadRes = await uploadFileAtS3(paywallRevFileName);
            console.log("uploadRes: ", uploadRes);
            if (uploadRes.status) {
                messageObj.attachments.path = uploadRes.data.Location;
                helper.sendToQueue(messageObj);
            }

            console.log("=> dailyReport 14");
            fs.unlink(paywallRevFilePath,function(err,data) {
                if (err) {
                    console.log("=> [dailyReport]File not deleted");
                }
                console.log("=> [dailyReport]data");
            });
            console.log("=> [dailyReport]info");
        }).catch(er => {
            console.log("=> [dailyReport]err",er)
        });
        console.log("=> [dailyReport]resultToWrite",resultToWriteToCsv)
    } catch(err) {
        console.log("=> [dailyReport]",err);
    }
}

callBacksReport =async() => {
    try {
        let startDate = new Date("2020-06-19T00:00:00.000Z");
        let report =  await Subscription.aggregate([
            {
                $match: {
                    $or:[{source: "HE"},{source: "affiliate_web"}],
                    added_dtm: { $gte: startDate }
                }
            },
            {
                $lookup:
                    {
                        from: "billinghistories",
                        localField: "_id",
                        foreignField: "subscription_id",
                        as: "histories"
                    }
            },
            {
                $project: {
                    tid: "$affiliate_unique_transaction_id",
                    mid: "$affiliate_mid",
                    added_dtm: "$added_dtm",
                    active: "$active",
                    callbackhistory: {
                        $filter: {
                            input: "$histories",
                            as: "histor",
                            cond: {$eq: ["$$histor.billing_status", "Affiliate callback sent" ] }
                        }
                    }
                }
            },
            {
                $project: {
                    tid: "$tid",
                    mid: "$mid",
                    isValidUser: {$cond: {if: {$eq:["$active",true]}, then: true, else: false } },
                    added_dtm: "$added_dtm",
                    callbackhistorySize: {"$size": "$callbackhistory" },
                    callbackObj: {$arrayElemAt: ["$callbackhistory",0]},
                    added_dm: { '$dateToString' : { date: "$added_dtm",'format':'%Y-%m-%d-%H:%M:%S','timezone' : "Asia/Karachi" } },
                }
            },
            {
                $project: {
                    tid: "$tid",
                    mid: "$mid",
                    isValidUser: "$isValidUser",
                    callbackhistorySize: "$callbackhistorySize",
                    added_dm: { '$dateToString' : { date: "$added_dtm",'format':'%Y-%m-%d-%H:%M:%S','timezone' : "Asia/Karachi" } },
                    billing_dm: { '$dateToString' : { date: "$callbackObj.billing_dtm",'format':'%Y-%m-%d-%H:%M:%S','timezone' : "Asia/Karachi" } }
                }
            },
            {
                $project: {
                    tid: "$tid",
                    mid: "$mid",
                    isValidUser: "$isValidUser",
                    added_dtm:  {$cond: {if: "$isValidUser", then: "$added_dm" , else: "" } },
                    isCallbAckSent: {$cond: { if: { $and: [{$gte: ["$callbackhistorySize",1]},{$eq: [ "$isValidUser",true ]} ] } ,then:"yes",else:"no" }} ,
                    callBackSentTime: {$cond: {if: "$isValidUser", then: "$billing_dm" , else: "" } }
                }
            }
        ]);

        let write = await csvReportWriter.writeRecords(report);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","nauman@dmdmax.com","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Callbacks Report';
        messageObj.text = `Callbacks sent with their TIDs and timestamps -  ${(new Date()).toDateString()}`;
        messageObj.attachments = {
            filename: paywallCallbackReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallCallbackReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     // to:  ["paywall@dmdmax.com.pk"],
        //     to:  ["paywall@dmdmax.com.pk","nauman@dmdmax.com","mikaeel@dmdmax.com"], // list of receivers
        //     subject: `Callbacks Report`, // Subject line
        //     text: `Callbacks sent with their TIDs and timestamps -  ${(new Date()).toDateString()}`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallCallbackReport,
        //             path: paywallCallbackFilePath
        //         }
        //     ]
        // });
        console.log("***> Report");
        fs.unlink(paywallCallbackFilePath,function(err,data) {
            if (err) {
                console.log("***> File not deleted");
            }
            console.log("***> data",data);
        });
    } catch(err) {
        console.log("***> Error", err);
    }

}

errorCountReport = async() => {
    try {
        let errorBySourceReport = await billinghistoryRepo.errorCountReportBySource();
        console.log("=> done 1");
        let errorReport = await billinghistoryRepo.errorCountReport();
        console.log("=> done 2");
        
        await errorCountReportWriter.writeRecords(errorReport);
        await errorCountReportBySource.writeRecords(errorBySourceReport);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Daily Error Reports';
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains all error count stats from 23rd February 2020 onwards.`;
        messageObj.attachments = {
            filename: paywallErrorCountReport,
            path: path
        };

        messageObj.attachments = [
            {
                filename: paywallErrorCountReport,
                path: path
            },
            {
                filename: paywallErrorCountReportBySource,
                path: path
            }
        ]

        let uploadRes = await uploadFileAtS3(paywallErrorCountReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments[0].path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        uploadRes = await uploadFileAtS3(paywallErrorCountReportBySource);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments[1].path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     to:  ["farhan.ali@dmdmax.com"],
        //     //to:  ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com"], // list of receivers
        //     subject: `Daily Error Reports`, // Subject line
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains all error count stats from 23rd February 2020 onwards.`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallErrorCountReport,
        //             path: paywallErrorCountFilePath
        //         },
        //         {
        //             filename: paywallErrorCountReportBySource,
        //             path: paywallErrorCountBySourceFilePath
        //         }
        //     ]
        // });
        console.log("=> [errorCountReport][emailSent]");
        fs.unlink(paywallErrorCountFilePath,function(err,data) {
            if (err) {
                console.log("File not deleted[errorCountReport]");
            }
            console.log("File deleted [errorCountReport]");
        });
        fs.unlink(paywallErrorCountBySourceFilePath,function(err,data) {
            if (err) {
                console.log("File not deleted[errorCountReportBySource]");
            }
            console.log("File deleted [errorCountReportBySource]");
        });
    } catch (error) {
        console.error("=>", error);
    }
}

dailyUnsubReport = async(from,to) => {
    try {
        let dailyUnsubReport = await billinghistoryRepo.dailyUnsubReport();

        await dailyUnsubReportWriter.writeRecords(dailyUnsubReport);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Daily Unsubscribed Users Report';
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains count of unsubscribed users.`;
        messageObj.attachments = {
            filename: paywallUnsubReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallUnsubReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     // to:  ["hamza@dmdmax.com"],
        //     to:  ["paywall@dmdmax.com.pk"], // list of receivers
        //     subject: `Daily Unsubscribed Users Report`, // Subject line
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains count of unsubscribed users.`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallUnsubReport,
        //             path: paywallUnsubFilePath
        //         }
        //     ]
        // });
        console.log("[dailyUnsubReport][emailSent]");
        fs.unlink(paywallUnsubFilePath,function(err,data) {
            if (err) {
                console.log("File not deleted[dailyUnsubReport]");
            }
            console.log("File deleted [dailyUnsubReport]");
        });
    } catch (error) {
        console.error(error);
    }
}

dailyNetAddition = async(from, to) => {
    try {
        let csvData = [];

        console.log("=> from", from, "to", to);
        let dailySubscriptions = await subscriptionRepo.getAllSubscriptionsByDate(from, to);
        let dailyUnSubscriptions = await billinghistoryRepo.unsubReport(from, to);

        for(let i = 0; i < dailySubscriptions.length; i++){
            let data = {};
            data.date = dailySubscriptions[i].date;
            if(new Date(dailySubscriptions[i].date).getTime() === new Date(dailyUnSubscriptions[i].date).getTime()){
                data.subs = dailySubscriptions[i].count;
                data.unsubs = dailyUnSubscriptions[i].count;
                data.net = (dailySubscriptions[i].count - dailyUnSubscriptions[i].count);
                csvData.push(data);
            }
        }

        await dailyNetAdditionWriter.writeRecords(csvData);
        let messageObj = {}, path = null;
        messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Daily Net Additions - ${monthNames[from.getMonth()]}`;
        messageObj.text = `This report contains daily net additions for the month of ${monthNames[from.getMonth()]}.`;
        messageObj.attachments = {
            filename: dailyNetAdditionCsv,
            path: path
        };

        let uploadRes = await uploadFileAtS3(dailyNetAdditionCsv);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        console.log("=> Daily Addition Report");
        // from = new Date(from);
        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["farhan.ali@dmdmax.com"],
        //     // to:  ["paywall@dmdmax.com.pk", "zara.naqi@telenor.com.pk", "mikaeel@dmdmax.com", "khurram.javaid@telenor.com.pk", "junaid.basir@telenor.com.pk"], // list of receivers
        //     subject: `Daily Net Additions - ${monthNames[from.getMonth()]}`,
        //     text: `This report contains daily net additions for the month of ${monthNames[from.getMonth()]}.`,
        //     attachments:[
        //         {
        //             filename: dailyNetAdditionCsv,
        //             path: dailyNetAdditionFilePath
        //         }
        //     ]
        // });
        console.log("=> [dailyNetAdditionCsv][emailSent]");
        fs.unlink(dailyNetAdditionFilePath,function(err,data) {
            if (err) {
                console.log("=> File not deleted[dailyNetAdditionCsv]");
            }
            console.log("=> File deleted [dailyNetAdditionCsv]");
        });
    } catch (error) {
        console.error("=> error ", error);
    }
}

avgTransactionPerCustomer = async(from, to) => {
    try {
        console.log("=> AvgTransactionPerCustomer from", from, "to", to);
        let totalTransactions = await billinghistoryRepo.numberOfTransactions(from, to);
        totalTransactions = totalTransactions[0].count;

        let totalUniqueUsers = await billinghistoryRepo.totalUniqueTransactingUsers(from, to);
        totalUniqueUsers = totalUniqueUsers[0].count;

        let avgTransactions = totalTransactions / totalUniqueUsers;

        console.log("=> Avg. Transactions Per Customer Report");
        from = new Date(from);
        let messageObj = {};
        messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Avg Transactions/Customer - ${monthNames[from.getMonth()]}`;
        messageObj.text = `Avg Transactions/Customer for the month of ${monthNames[from.getMonth()]} are ${avgTransactions}`;

        helper.sendToQueue(messageObj);

        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["farhan.ali@dmdmax.com"],
        //     // to:  ["paywall@dmdmax.com.pk", "zara.naqi@telenor.com.pk", "mikaeel@dmdmax.com", "khurram.javaid@telenor.com.pk", "junaid.basir@telenor.com.pk"], // list of receivers
        //     subject: `Avg Transactions/Customer - ${monthNames[from.getMonth()]}`,
        //     text: `Avg Transactions/Customer for the month of ${monthNames[from.getMonth()]} are ${avgTransactions}`,
        // });
        console.log("=> [avgTransactionPerCustomer][emailSent]");
    } catch (error) {
        console.error("=> avgTransactionPerCustomer- error ", error);
    }
}

weeklyRevenue = async(weekFromArray, weekToArray, emailList) => {
    try {
        let emailBody = "";

        for(let i = 0; i < weekFromArray.length; i++){
            let weekFrom = weekFromArray[i];
            let weekTo = weekToArray[i];

            console.log("=> weeklyRevenue from", weekFrom, "to", weekTo);
            let revenue = await billinghistoryRepo.getRevenueInDateRange(weekFrom, weekTo);
            emailBody = emailBody.concat(`${weekFrom} - ${weekTo}:   ${revenue[0].total}\n`);
        }

        let messageObj = {};
        messageObj.to = emailList;
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Weekly Revenue Report - ${monthNames[weekFromArray[0].getMonth()]}`;
        messageObj.text = emailBody;

        helper.sendToQueue(messageObj);

        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  emailList,
        //     subject: `Weekly Revenue Report - ${monthNames[weekFromArray[0].getMonth()]}`,
        //     text: emailBody,
        // });

        console.log("=> [weeklyRevenue][emailSent]");
        
    } catch (error) {
        console.error("=> weeklyRevenue- error ", error);
    }
}

weeklyTransactingCustomers = async(weekFromArray, weekToArray, emailList) => {

    try {
        let emailBody = "";

        for(let i = 0; i < weekFromArray.length; i++){
            let weekFrom = weekFromArray[i];
            let weekTo = weekToArray[i];

            console.log("=> weeklyTransactingCustomers from", weekFrom, "to", weekTo);
            let totalUniqueUsers = await billinghistoryRepo.totalUniqueTransactingUsers(weekFrom, weekTo);
            emailBody = emailBody.concat(`${weekFrom} - ${weekTo}:   ${totalUniqueUsers[0].count}\n`);
        }

        let messageObj = {};
        messageObj.to = emailList;
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Weekly Transacting Customers - ${monthNames[weekFromArray[0].getMonth()]}`;
        messageObj.text = emailBody;

        helper.sendToQueue(messageObj);

        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  emailList,
        //     subject: `Weekly Transacting Customers - ${monthNames[weekFromArray[0].getMonth()]}`,
        //     text: emailBody,
        // });
        console.log("=> [weeklyTransactingCustomers][emailSent]");
        
    } catch (error) {
        console.error("=> weeklyTransactingCustomers- error ", error);
    }
}

dailyReturningUsers = async(from, to) => {
    try {
        console.log("=> DailyReturningUsers from", from, "to", to);
        let dailyReturningUsers = await billinghistoryRepo.dailyReturningUsers(from, to);
        console.log("=> DailyReturningUsers", dailyReturningUsers);
        if (dailyReturningUsers.length > 0){
            let dailyReturningUsersCount = dailyReturningUsers[0].totalcount;
            console.log(`=> Daily Returning Users for ${to} are ${dailyReturningUsersCount}`);

            let messageObj = {};
            messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
            // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
            messageObj.subject = `Daily Returning Users`;
            messageObj.text = `Daily returning users for the date ${to} are ${dailyReturningUsersCount}`;

            helper.sendToQueue(messageObj);

            // let info = await transporter.sendMail({
            //     from: 'paywall@dmdmax.com.pk',
            //     //to:  ["farhan.ali@dmdmax.com"],
            //     to:  ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com"],
            //     subject: `Daily Returning Users`,
            //     text: `Daily returning users for the date ${to} are ${dailyReturningUsersCount}`,
            // });
            console.log("=> [dailyReturningUsers][emailSent]");
        }
    } catch (error) {
        console.error("=> dailyReturningUsers- error ", error);
    }
}

dailyChannelWiseUnsub = async() => {
    try {
        console.log("=> [dailyChannelWiseUnsub]");
        let records = [];
        let dailyChannelWiseUnsub = await billinghistoryRepo.dailyChannelWiseUnsub(); 
        console.log("=> done 1"); 
        let dailyExpiredBySystem = await billinghistoryRepo.dailyExpiredBySystem();
        console.log("=> done 2");

        dailyChannelWiseUnsub.forEach(element => {
            let date = element.date;
            let source = element.source;
            let count = element.count;
            
            let present = isDatePresent(records, date);
            if(present){
                if(source === "app" || source == "na"){
                    present.app = (present.app + count);
                    present.total = (present.total + count);
                }else if(source === "web"){
                    present.web = (present.web + count);
                    present.total = (present.total + count);
                }else if(source === "sms"){
                    present.sms = (present.sms + count);
                    present.total = (present.total + count);
                }else if(source === "CC"){
                    present.cc = (present.cc + count);
                    present.total = (present.total + count);
                }else if(source === "CP"){
                    present.cp = (present.cp + count);
                    present.total = (present.total + count);
                }
            }else{
                let expiredBySystem = isDatePresent(dailyExpiredBySystem, date);
                let app = (source === "app" || source == "na") ? count : 0;
                let web = source === "web" ? count : 0;
                let sms = source === "sms" ? count : 0;
                let cc = source === "CC" ? count : 0;
                let cp = source === "CP" ? count : 0;
                let expired = expiredBySystem !== undefined ? expiredBySystem.count : 0;

                let total = (app + web + sms + cc + cp + expired);

                let object = {date: date, app: app, web: web, sms: sms, cc: cc, cp: cp, expired: expired, total: total};
                records.push(object);
            }
            
        });

        await dailyChannelWiseUnsubWriter.writeRecords(records);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","nauman@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Daily Source Wise Unsubscribed Users Report';
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains count of unsubscribed users with respect to source.\n\nNote: Expired By System column indicates those users expired by the system because their grace time is over and they still have no balance.`;
        messageObj.attachments = {
            filename: paywallChannelWiseUnsubReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallChannelWiseUnsubReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // console.log("=> done 3");
        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     // to:  ["farhan.ali@dmdmax.com"],
        //     to:  ["paywall@dmdmax.com.pk","nauman@dmdmax.com"], // list of receivers
        //     subject: `Daily Source Wise Unsubscribed Users Report`, // Subject line
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains count of unsubscribed users with respect to source.\n\nNote: Expired By System column indicates those users expired by the system because their grace time is over and they still have no balance.`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallChannelWiseUnsubReport,
        //             path: paywallChannelWiseUnsubReportFilePath
        //         }
        //     ]
        // });
        console.log("=> [dailyChannelWiseUnsub][emailSent]");
        fs.unlink(paywallChannelWiseUnsubReportFilePath,function(err,data) {
            if (err) {
                console.log("=> File not deleted[dailyChannelWiseUnsub]");
            }
            console.log("=> File deleted [dailyChannelWiseUnsub]");
        });
    } catch (error) {
        console.error("=>", error);
    }
}

dailyChannelWiseTrialActivated = async() => {
    try {
        console.log("[dailyChannelWiseTrialActivated]");
        let records = [];
        let dailyChannelWiseTrial = await billinghistoryRepo.dailyChannelWiseTrialActivated(); 

        dailyChannelWiseTrial.forEach(element => {
            let date = element.date;
            let source = element.source;
            let count = element.count;
            
            let present = isDatePresent(records, date);
            if(present){
                if(source === "app"){
                    present.app = (present.app + count);
                    present.total = (present.total + count);
                }else if(source === "web"){
                    present.web = (present.web + count);
                    present.total = (present.total + count);
                }else if(source === "HE"){
                    present.HE = (present.HE + count);
                    present.total = (present.total + count);
                }
            }else{
                let app = source === "app" ? count : 0;
                let web = source === "web" ? count : 0;
                let HE = source === "HE" ? count : 0;
                let total = (app + web + HE);

                let object = {date: date, app: app, web: web, HE: HE, total: total};
                records.push(object);
            }
            
        });

        await dailyChannelWiseTrialWriter.writeRecords(records);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Source Wise Trial Activated Report` // plain text bodyday
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains count of trials activated with respect to source.`;
        messageObj.attachments = {
            filename: paywallChannelWiseTrial,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallChannelWiseTrial);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     // to:  ["paywall@dmdmax.com.pk"],
        //     to:  ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com"], // list of receivers
        //     subject: `Source Wise Trial Activated Report`, // Subject line
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains count of trials activated with respect to source.`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallChannelWiseTrial,
        //             path: paywallChannelWiseTrialFilePath
        //         }
        //     ]
        // });
        console.log("[dailyChannelWiseTrialActivated][emailSent]");
        fs.unlink(paywallChannelWiseTrialFilePath,function(err,data) {
            if (err) {
                console.log("File not deleted[paywallChannelWiseTrial]");
            }
            console.log("File deleted [dailyChannelWiseTrialActivated]");
        });
    } catch (error) {
        console.error(error);
    }
}

dailyTrialToBilledUsers = async() => {
    try {
        console.log("=> dailyTrialToBilledUsers");

        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
    
        let dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        dayBeforeYesterday.setHours(0, 0, 0, 0);
        console.log("=> Query from - ", dayBeforeYesterday, ' - to ', yesterday);

        let trialToBilled = await subscriptionRepo.dailyTrialToBilledUsers(dayBeforeYesterday, yesterday);
        console.log("=> ", JSON.stringify(trialToBilled));

        let totalSum = 0;
        for (let i = 0; i < trialToBilled.length; i++){
            totalSum += trialToBilled[i].count;
        }
        console.log("=> sending email ", totalSum);

        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk", "nauman@dmdmax.com", "mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Trial To Billed Users`; // plain text bodyday
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains count of users who are directly billed after trial from ${dayBeforeYesterday} to ${yesterday}.\n\nTrial: ${dayBeforeYesterday}\nBilled: ${yesterday}\nCount: ${totalSum}`;

        helper.sendToQueue(messageObj);


        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["paywall@dmdmax.com.pk", "nauman@dmdmax.com", "mikaeel@dmdmax.com"],
        //     subject: 'Trial To Billed Users',
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains count of users who are directly billed after trial from ${dayBeforeYesterday} to ${yesterday}.\n\nTrial: ${dayBeforeYesterday}\nBilled: ${yesterday}\nCount: ${totalSum}`
        // });

        console.log("=> [trialToBilledUsers][emailSent]");
    } catch (error) {
        console.error(error);
    }
}

dailyFullAndPartialChargedUsers = async() => {
    try {
        console.log("=> dailyFullAndPartialChargedUsers");
        let dailyReport = await billinghistoryRepo.getDailyFullyChargedAndPartialChargedUsers();
        console.log("=> done 1");
        let array = [];

        dailyReport.forEach(element => {
            let obj = isDatePresent(array, element.date);
            if(!obj){
                obj = {date: element.date};
                array.push(obj);
            }

            if(element.micro_charge_state === true){
                obj.partially_charged_users = element.total;
            }else{
                obj.fully_charged_users = element.total;
            }
            obj.total = obj.total ? (obj.total + element.total) : element.total;
        });

        await csvFullAndPartialCharged.writeRecords(array);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk",  "mikaeel@dmdmax.com", "nauman@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Full & Partial Charged Users';
        messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains count of full & partial charged users.`; // plain text bodyday
        messageObj.attachments = {
            filename: paywallFullAndPartialChargedReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallFullAndPartialChargedReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     // to:  ["farhan.ali@dmdmax.com"],
        //     to:  ["paywall@dmdmax.com.pk",  "mikaeel@dmdmax.com", "nauman@dmdmax.com"], // list of receivers
        //     subject: 'Full & Partial Charged Users',
        //     text: `This report (generated at ${(new Date()).toDateString()}) contains count of full & partial charged users.`, // plain text bodyday
        //     attachments:[
        //         {
        //             filename: paywallFullAndPartialChargedReport,
        //             path: paywallFullAndPartialChargedReportFilePath
        //         }
        //     ]
        // });
        console.log("=> [fullAndPartialChargedUsers][emailSent]");
        fs.unlink(paywallFullAndPartialChargedReportFilePath,function(err,data) {
            if (err) {
                console.log("=> File not deleted");
            }
            console.log("=> ", data);
        });
    } catch (error) {
        console.error("=>", error);
    }
}

dailyPageViews = async() => {
    console.log("***=> sending email")
    pageViews.connect().then(async(db) => {

        pageViews.getPageViews(db).then(async(pvs) => {
            console.log("***=>", pvs);
            await csvAffiliatePvs.writeRecords(pvs);
            let messageObj = {}, path = null;
            messageObj.to = ["paywall@dmdmax.com.pk","nauman@dmdmax.com", "mikaeel@dmdmax.com"];
            // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
            messageObj.subject = 'Affiliate Page Views';
                messageObj.text = `This report (generated at ${(new Date()).toDateString()}) contains affiliate page views`; // plain text bodyday
                messageObj.attachments = {
                    filename: affiliatePvs,
                    path: path
                };

            let uploadRes = await uploadFileAtS3(affiliatePvs);
            console.log("uploadRes: ", uploadRes);
            if (uploadRes.status) {
                messageObj.attachments.path = uploadRes.data.Location;
                helper.sendToQueue(messageObj);
            }


                // var info = await transporter.sendMail({
                // from: 'paywall@dmdmax.com.pk',
                // // to:  ["hamza@dmdmax.com"],
                // to:  ["paywall@dmdmax.com.pk","nauman@dmdmax.com", "mikaeel@dmdmax.com"], // list of receivers
                // subject: 'Affiliate Page Views',
                // text: `This report (generated at ${(new Date()).toDateString()}) contains affiliate page views`, // plain text bodyday
                // attachments:[
                //     {
                //         filename: affiliatePvs,
                //         path: affiliatePvsFilePath
                //     }
                // ]
            // });
            console.log("***=> [csvAffiliatePvs][emailSent]");
            fs.unlink(affiliatePvsFilePath,function(err,data) {
                if (err) {
                    console.log("***=>File not deleted");
                }
                console.log("***=>", data);
            });
        }).catch(err => {
            console.log("***=>", err);
        });
        }).then(err => {
            console.log(err);
        });
}

getTotalUserBaseTillDate = async(from, to) => {
    let result = await usersRepo.getTotalUserBaseTillDate(from, to);
    await csvTotalBase.writeRecords(result);

    let messageObj = {}, path = null;
    messageObj.to = ["paywall@dmdmax.com.pk", "mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
    // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
    messageObj.subject = 'Paywall Total Base',
    messageObj.text = `This report contains total user base from ${new Date(from)} to ${new Date(to)}.`, // plain text bodyday
    messageObj.attachments = {
        filename: paywallTotalBase,
        path: path
    };

    let uploadRes = await uploadFileAtS3(paywallTotalBase);
    console.log("uploadRes: ", uploadRes);
    if (uploadRes.status) {
        messageObj.attachments.path = uploadRes.data.Location;
        helper.sendToQueue(messageObj);
    }


    // var info = await transporter.sendMail({
    //     from: 'paywall@dmdmax.com.pk', // sender address
    //     to:  ["paywall@dmdmax.com.pk", "mikaeel@dmdmax.com"],
    //     //to:  ["paywall@dmdmax.com.pk","zara.naqi@telenor.com.pk","mikaeel@dmdmax.com"], // list of receivers
    //     subject: `Paywall Total Base`, // Subject line
    //     text: `This report contains total user base from ${new Date(from)} to ${new Date(to)}.`,
    //     attachments:[
    //         {
    //             filename: paywallTotalBase,
    //             path: paywallTotalBaseFilePath
    //         }
    //     ]
    // });
    console.log("[totalBase][emailSent]");
    fs.unlink(paywallTotalBaseFilePath,function(err,data) {
        if (err) {
            console.log("File not deleted[totalBase]");
        }
        console.log("File deleted [totalBase]");
    });
}

getExpiredBase = async() => {
    console.log('=> getExpiredBase');
    let result = await subscriptionRepo.getExpiredFromSystem();
    console.log('=> returned result counts ', result);
    let finalResult = [];
    for(let i = 0; i < result.length; i++){
        console.log('=>', result[i].userDetails.msisdn);
        finalResult.push({msisdn: result[i].userDetails.msisdn});
    }

    console.log('=> preparing csv - ', finalResult);

    await csvExpiredBase.writeRecords(finalResult);
    console.log('=> after writeRecords ');

    let messageObj = {}, path = null;
    // messageObj.to = ["muhammad.azam@dmdmax.com"];
    messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
    messageObj.subject = '5. Expired Base Msisdns';
    messageObj.text = `This report contains total expired base i.e 7th Feb to date.`; // plain text bodyday
    messageObj.attachments = {
        filename: paywallExpiredBase,
        path: path
    };

    console.log('=> messageObj ', messageObj);

    let uploadRes = await uploadFileAtS3(paywallExpiredBase);
    console.log("uploadRes: ", uploadRes);
    if (uploadRes.status) {
        messageObj.attachments.path = uploadRes.data.Location;
        helper.sendToQueue(messageObj);
    }


    // console.log('=> sending email');
    // var info = await transporter.sendMail({
    //     from: 'paywall@dmdmax.com.pk', // sender address
    //     to:  ["muhammad.azam@dmdmax.com"],
    //     subject: `5. Expired Base Msisdns`, // Subject line
    //     text: `This report contains total expired base i.e 7th Feb to date.`,
    //     attachments:[
    //         {
    //             filename: paywallExpiredBase,
    //             path: paywallExpiredBaseFilePath
    //         }
    //     ]
    // });
    console.log("=> [expiredBase][emailSent]");
    fs.unlink(paywallExpiredBaseFilePath,function(err,data) {
        if (err) {
            console.log("=> File not deleted[expiredBase]");
        }
        console.log("=> File deleted [expiredBase]");
    });
}

getInactiveBase = async(from, to) => {
    let result = await usersRepo.getActiveUsers(from, to);

    let totalLength = result.length;
    let count = 0;
    console.log("*** Length: "+totalLength);

    let finalResult = [];
    let fiveDaysBack = new Date();
    fiveDaysBack.setDate(fiveDaysBack.getDate() - 7);

    let promise = new Promise((resolve, reject) => {
        result.forEach((user) => {
            getViewLogs(user._id).then((viewLog) => {
                console.log("*** Got result for ", user.msisdn);
    
                let latestLogTime = new Date(viewLog.added_dtm);
                if(fiveDaysBack.getTime() > latestLogTime.getTime()){
                    // Means 5 days passed user last visited app/web
                    finalResult.push({"msisdn": user.msisdn});
                }
            }).catch((err) => {
                //console.log("error ", err);
            }).finally(() => {
                console.log("*** Finally");
                count+=1;

                if (count === totalLength){
                    console.log("*** Resolved"); 
                    resolve();
                }
            });
        });
    });
    
    promise.then(async() => {
        console.log("*** ALL DONE");
        await csvInActiveBase.writeRecords(finalResult);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","mikaeel@dmdmax.com","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Paywall InActive Base',
        messageObj.text = `This report contains inactive base from ${new Date(from)} to ${new Date(to)}.\nInActive: Have not opened App/Web in last 7 days but are subscribed users`, // plain text bodyday
        messageObj.attachments = {
            filename: paywallInActiveBase,
            path: path
        };

        let uploadRes = await uploadFileAtS3(paywallInActiveBase);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }



        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     to:  ["paywall@dmdmax.com.pk", "mikaeel@dmdmax.com"],
        //     //to:  ["paywall@dmdmax.com.pk","zara.naqi@telenor.com.pk","mikaeel@dmdmax.com"], // list of receivers
        //     subject: `Paywall InActive Base`, // Subject line
        //     text: `This report contains inactive base from ${new Date(from)} to ${new Date(to)}.\nInActive: Have not opened App/Web in last 7 days but are subscribed users`,
        //     attachments:[
        //         {
        //             filename: paywallInActiveBase,
        //             path: paywallInActiveBaseFilePath
        //         }
        //     ]
        // });
        console.log("*** [paywallInActiveBase][emailSent]");
        fs.unlink(paywallInActiveBaseFilePath,function(err,data) {
            if (err) {
                console.log("*** File not deleted[paywallInActiveBase]");
            }
            console.log("*** File deleted [paywallInActiveBase]");
        });
    })
}

getUsersNotSubscribedAfterSubscribe = async() => {
    try{
        let result = await billinghistoryRepo.getUsersNotSubscribedAfterSubscribe();
        console.log("=> ALL DONE");
        await ActiveBaseWriter.writeRecords(result);
        let messageObj = {}, path = null;
        messageObj.to = ["paywall@dmdmax.com.pk","muhammad.azam@dmdmax.com"];
        // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = 'Users who subscribed in Jul but did subscribe in Aug',
            messageObj.text = `This report contains users who subscribed in Jul but did subscribe in Aug`, // plain text bodyday
            messageObj.attachments = {
                filename: ActiveBase,
                path: path
            };

        let uploadRes = await uploadFileAtS3(ActiveBase);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // var info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk', // sender address
        //     to:  ["paywall@dmdmax.com.pk"],
        //     subject: `Users who subscribed in Jul but did subscribe in Aug`,
        //     text: `This report contains users who subscribed in Jul but did subscribe in Aug`,
        //     attachments:[
        //         {
        //             filename: ActiveBase,
        //             path: ActiveBaseFilePath
        //         }
        //     ]
        // });

        console.log("=> [ActiveBaseFilePath][emailSent]");
        fs.unlink(ActiveBaseFilePath,function(err,data) {
            if (err) {
                console.log("=> File not deleted[ActiveBaseFilePath]");
            }
            console.log("=> File deleted [ActiveBaseFilePath]");
        });
    }catch(e){
        console.log("=>", e);
    }
}

getActiveBase = async(from, to) => {
    let result = await usersRepo.getActiveUsers(from, to);
    console.log("*** ALL DONE");
    await ActiveBaseWriter.writeRecords(result);
    let messageObj = {}, path = null;
    messageObj.to = ["paywall@dmdmax.com.pk","muhammad.azam@dmdmax.com"];
    // messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
    messageObj.subject = `Paywall Active Base`,
        messageObj.text =  `This report contains active base from ${new Date(from)} to ${new Date(to)}.`
        messageObj.attachments = {
            filename: ActiveBase,
            path: path
        };

    let uploadRes = await uploadFileAtS3(ActiveBase);
    console.log("uploadRes: ", uploadRes);
    if (uploadRes.status) {
        messageObj.attachments.path = uploadRes.data.Location;
        helper.sendToQueue(messageObj);
    }


    // var info = await transporter.sendMail({
    //     from: 'paywall@dmdmax.com.pk', // sender address
    //     to:  ["paywall@dmdmax.com.pk","muhammad.azam@dmdmax.com"],
    //     subject: `Paywall Active Base`, // Subject line
    //     text: `This report contains active base from ${new Date(from)} to ${new Date(to)}.`,
    //     attachments:[
    //         {
    //             filename: ActiveBase,
    //             path: ActiveBaseFilePath
    //         }
    //     ]
    // });
    console.log("*** [ActiveBaseFilePath][emailSent]");
    fs.unlink(ActiveBaseFilePath,function(err,data) {
        if (err) {
            console.log("*** File not deleted[ActiveBaseFilePath]");
        }
        console.log("*** File deleted [ActiveBaseFilePath]");
    });
}

generateUsersReportWithTrialAndBillingHistory = async(from, to) => {
    console.log("=> generateUsersReportWithTrialAndBillingHistory - from ", from, " to ", to);
    let finalResult = [];
    
    let aff_mids = [{affiliate_mid: "goonj"},{affiliate_mid: "1569"},{affiliate_mid: "gdn"},
        {affiliate_mid: "gdn2"},{affiliate_mid: "aff3"},{affiliate_mid: "aff3a"}
    ]

    let affMidsSubscriptions = await subscriptionRepo.getSubscriptionsForAffiliateMids(aff_mids, from, to);
    
    for(let i = 0; i < affMidsSubscriptions.length; i++){
        console.log("=> fetching data for affiliate mid ",affMidsSubscriptions[i]._id);
        let user_ids = affMidsSubscriptions[i].user_ids;
        let result = await billinghistoryRepo.getBillingDataForSpecificSubscriberIds(user_ids);
        
        for(let j = 0; j < result.length; j++){
            console.log("=> user_id", result[j].user_id);
            
            let dataPresent = isDataPresent(finalResult, result[j].user_id);
            if(dataPresent){
                if(result[j].billing_status === "Success"){
                    dataPresent.success_transactions = dataPresent.success_transactions + 1;
                    dataPresent.amount = dataPresent.amount + result[j].price;
                }else if(result[j].billing_status === "trial"){
                    dataPresent.code = 0;
                }
            }else{
                let singleObject = {};
                singleObject.mid = affMidsSubscriptions[i]._id;
                singleObject.user_id = result[j].user_id;
                
                if(result[j].billing_status === "Success"){
                    singleObject.success_transactions = 1;
                    singleObject.amount = result[j].price;
                    singleObject.code = 1;
                }else if(result[j].billing_status === "trial"){
                    singleObject.success_transactions = 0;
                    singleObject.amount = 0;
                    singleObject.code = 0
                }
                finalResult.push(singleObject);
            }
        }
    }
    
    console.log("=>", JSON.stringify(finalResult));

    console.log("=> Sending email");
    await usersReportWithTrialAndBillingHistoryWriter.writeRecords(finalResult);
    let messageObj = {}, path = null;
    messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
    messageObj.subject = `Users With Trial & Billing Details`,
    messageObj.text =  `This report contains affiliate users with trial and billing details from ${new Date(from)} to ${new Date(to)}.\nNote: code 0 indicates trial and code 1 indicates subscribed directly.`
    messageObj.attachments = {
        filename: usersReportWithTrialAndBillingHistory,
        path: path
    };

    let uploadRes = await uploadFileAtS3(usersReportWithTrialAndBillingHistory);
    console.log("uploadRes: ", uploadRes);
    if (uploadRes.status) {
        messageObj.attachments.path = uploadRes.data.Location;
        helper.sendToQueue(messageObj);
    }


    // let info = await transporter.sendMail({
    //     from: 'paywall@dmdmax.com.pk',
    //     to:  ["farhan.ali@dmdmax.com"],
    //     subject: `Users With Trial & Billing Details`, // Subject line
    //     text: `This report contains affiliate users with trial and billing details from ${new Date(from)} to ${new Date(to)}.\nNote: code 0 indicates trial and code 1 indicates subscribed directly`,
    //     attachments:[
    //         {
    //             filename: usersReportWithTrialAndBillingHistory,
    //             path: usersReportWithTrialAndBillingHistoryFilePath
    //         }
    //     ]
    // });

    console.log("=> [usersReportWithTrialAndBillingHistory][emailSent]");
    fs.unlink(usersReportWithTrialAndBillingHistoryFilePath,function(err,data) {
        if (err) {
            console.log("=> File not deleted[usersReportWithTrialAndBillingHistory]");
        }
        console.log("=> File deleted [usersReportWithTrialAndBillingHistory]");
    });
}

generateReportForAcquisitionSourceAndNoOfTimeUserBilled = async() => {
    console.log("=> generateReportForAcquisitionSourceAndNoOfTimeUserBilled");
    let finalResult = [];

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){
                let singObject = {
                    msisdn: inputData[i]
                }

                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                if(user){
                    let dou = await viewLogsRepo.getDaysOfUseInDateRange(user._id, "2021-10-01T00:00:00.000Z", "2021-04-26T00:00:00.000Z");
                    if(dou && dou.length > 0){
                        singObject.dou = dou[0].count;
                    }else{
                        singObject.dou = 0;
                    }

                    let subscriptions = await subscriptionRepo.getAllSubscriptions(user._id);
                    if(subscriptions && subscriptions.length > 0){
                        let addedDtm = subscriptions[0].added_dtm;
                        let subsCount = subscriptions.length;

                        // let totalSuccessTransactions = 0;

                        // for(let sub = 0; sub < subscriptions.length; sub++){
                        //     totalSuccessTransactions += subscriptions[sub].total_successive_bill_counts;
                        // }

                        // let totalSuccessTransactionsInDec = await billinghistoryRepo.numberOfTransactionsOfSpecificSubscriber(subscriber._id, inputData[i][1] + "T00:00:00.000Z", inputData[i][1] + "T23:59:59.000Z");

                        // let totalSuccessTransactionsInDec = await billinghistoryRepo.numberOfTransactionsOfSpecificSubscriber(subscriber._id, "2021-01-01T00:00:00.000Z", "2021-04-26T00:00:00.000Z");
                        let totalSuccessTransactionsInDec = await billinghistoryRepo.numberOfTransactionsOfSpecificSubscriber(user._id, "2021-01-01T00:00:00.000Z", "2021-04-26T00:00:00.000Z");
                        let totalSuccessTransactions = totalSuccessTransactionsInDec.length > 0 ? totalSuccessTransactionsInDec[0].count : 0;

                        singObject.subs_count = subsCount;
                        singObject.acquisition_date = addedDtm;
                        singObject.act_date = inputData[i][1];
                        singObject.number_of_success_charging = totalSuccessTransactions;

                        if(subscriptions[0].affiliate_mid){
                            singObject.acquisition_source = subscriptions[0].affiliate_mid;
                            singObject.affiliate_unique_transaction_id = subscriptions[0].affiliate_unique_transaction_id;
                        }else{
                            singObject.acquisition_source = subscriptions[0].source;
                            singObject.affiliate_unique_transaction_id = subscriptions[0].affiliate_unique_transaction_id;
                        }

                        let otp = await otpRepo.getOtp(inputData[i]);
                        if(otp && otp.verified === true){
                            singObject.source = "otp";
                        }else{
                            singObject.source = "he";
                        }

                        finalResult.push(singObject);
                        console.log("### Done ", i);

                    }else{
                        console.log("### No subscriptions found for", inputData[i][0]);
                    }
                }else{
                    console.log("### No user found for", inputData[i][0]);
                }
            }else{
                console.log("### Invalid number or number length");
            }
        }

        console.log("### Sending email");
        await randomReportWriter.writeRecords(finalResult);
        let messageObj = {}, path = null;
        // messageObj.to = ["muhammad.azam@dmdmax.com"];
        messageObj.to = ["muhammad.azam@dmdmax.com","nauman@dmdmax.com"];
        messageObj.subject = `Complaint Data`,
        messageObj.text =  `This report contains the details of msisdns being sent us over email from Telenor`
        messageObj.attachments = {
            filename: randomReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(randomReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["muhammad.azam@dmdmax.com"],
        //     // to:  ["farhan.ali@dmdmax.com"],
        //     subject: `Complaint Data`, // Subject line
        //     text: `This report contains the details of msisdns being sent us over email from Zara`,
        //     attachments:[
        //         {
        //             filename: randomReport,
        //             path: randomReportFilePath
        //         }
        //     ]
        // });

        console.log("###  [randomReport][emailSent]");
        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}


generateReportForAcquisitionRevenueAndSessions = async() => {
    console.log("=> generateReportForAcquisitionRevenueAndSessions");
    let finalResult = [];

    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        for(let i = 0; i < inputData.length; i++){
            let singObject = {};
            singObject.msisdn = inputData[i];
            // singObject.dou = 0;
            // singObject.mid = '';
            // singObject.tid = '';
            singObject.revenue = 0;
            singObject.acqusition_timestepms = '';
            
            if(inputData[i] && inputData[i].length === 11){
                let user = await usersRepo.getUserByMsisdn(inputData[i]);
                if(user){
                    // let dou = await viewLogsRepo.getDaysOfUseTotal(user._id, "2021-10-01T00:00:00.000Z", "2021-10-31T23:59:59.000Z");
                    // if(dou.length > 0){
                    //     singObject.dou = dou[0].douTotal;
                    // }else{
                    //     singObject.dou = 0;
                    // }

                    let totalRevenue = await billinghistoryRepo.getRevenueGeneratedByPerUser(user._id);
                    if(totalRevenue.length > 0){
                        singObject.revenue = totalRevenue[0].revenue;
                    }else{
                        singObject.revenue = 0;
                    }

                    let subscription = await subscriptionRepo.getSubscriptionsByHe(user._id);
                    if(subscription){
                        // singObject.mid = subscription.affiliate_mid;
                        // singObject.tid = subscription.affiliate_unique_transaction_id;
                        singObject.acqusition_timestepms = subscription.added_dtm;
                    }
                    else{
                        // singObject.mid = '';
                        // singObject.tid = '';
                        singObject.acqusition_timestepms = '';
                    }

                    console.log("### Done ", i);
                
                }else{
                    console.log("### No user found for", inputData[i]);
                }
            }
            else{
                console.log("### Invalid number or number length");
            }

            console.log("### singObject ", singObject);
            finalResult.push(singObject);
        }

        console.log("### Sending email", finalResult);
        await acqusitionRevenueReportWriter.writeRecords(finalResult);
        let messageObj = {};
        messageObj.to = ["taha@dmdmax.com"];
        messageObj.subject = `MSISDN list data`,
        messageObj.text =  `This report contains the details of msisdns sent us over email from Telenor`
        messageObj.attachments = {
            filename: randomReport,
            path: null
        };

        let uploadRes = await uploadFileAtS3(randomReport);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }

        console.log("###  [randomReport][emailSent]");
        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

getOnlySubscriberIds = async(source, fromDate, toDate) => {
    try{
        let records = await subscriptionRepo.getOnlySubscriberIds(source, fromDate, toDate);
        console.log("=> dateWiseChargingDetails - done1");
        let ids = await getArray(records);
        console.log("=> dateWiseChargingDetails - done2");
        let details = await billinghistoryRepo.getChargingDetails(ids, fromDate, toDate);

        console.log("=> Sending email");
        await dateWiseChargingDetailsWriter.writeRecords(details);

        let fromDuplicate = new Date(fromDate);

        let messageObj = {}, path = null;
        messageObj.to = ["farhan.ali@dmdmax.com","muhammad.azam@dmdmax.com"];
        messageObj.subject = `Day-wise Charging Details For ${source} - ${monthNames[fromDuplicate.getMonth()]}`; // Subject line
        messageObj.text =  `This report containing charging details of ${source}, day-wise for the month of ${monthNames[fromDuplicate.getMonth()]}`
        messageObj.attachments = {
            filename: dateWiseChargingDetails,
            path: path
        };

        let uploadRes = await uploadFileAtS3(dateWiseChargingDetails);
        console.log("uploadRes: ", uploadRes);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }


        // let info = await transporter.sendMail({
        //     from: 'paywall@dmdmax.com.pk',
        //     to:  ["farhan.ali@dmdmax.com"],
        //     subject: `Day-wise Charging Details For ${source} - ${monthNames[fromDuplicate.getMonth()]}`, // Subject line
        //     text: `This report containing charging details of ${source}, day-wise for the month of ${monthNames[fromDuplicate.getMonth()]}`,
        //     attachments:[
        //         {
        //             filename: dateWiseChargingDetails,
        //             path: dateWiseChargingDetailsFilePath
        //         }
        //     ]
        // });

        console.log("=> [dateWiseChargingDetails][emailSent]");
        fs.unlink(dateWiseChargingDetailsFilePath,function(err,data) {
            if (err) {
                console.log("=> File not deleted[dateWiseChargingDetails]");
            }
            console.log("=> File deleted [dateWiseChargingDetails]");
        });
    }catch(e){
        console.log("=> Error [dateWiseChargingDetails]", e);
    }
    
}

computeLoggerBitratesDataMsisdnWise = async() => {
    console.log("=> computeLoggerBitratesDataMsisdnWise");

    let finalResult = [];
    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        let startDate = '2021-01-01T00:00:00.000Z';
        let endDate = '2021-01-31T00:00:00.000Z';

        let dbConnection = await loggerMsisdnRepo.connect();
        console.log('dbConnection: ', dbConnection);

        for(let i = 0; i < inputData.length; i++){
            if(inputData[i] && inputData[i].length === 11){

                console.log("### Request for msisdn: ", inputData[i], i);
                let records = await loggerMsisdnRepo.computeBitratesMonthlyData(inputData[i], startDate, endDate, dbConnection);
                console.log('### records: ', records);
                if(records.length > 0){
                    for (let record of records) {
                        let singObject = { msisdn: inputData[i] }
                        singObject.month = "0" + record._id.logMonth + "-2021";
                        singObject.watchTime = record.totalBitRates * 5;

                        finalResult.push(singObject);
                        console.log('### Done: ')
                    }
                }
                else{
                    console.log("### Data not found: ");
                }
            }else{
                console.log("### Invalid number or number length: ");
            }
        }

        console.log("### Finally: ", finalResult.length);

        if (finalResult.length > 0){

            console.log("### Sending email");
            await loggerMsisdnWiseMonthlyReportWriter.writeRecords(finalResult);
            let messageObj = {}, path = null;
            messageObj.to = ["muhammad.azam@dmdmax.com"];
            messageObj.subject = `Complaint Data`;
            messageObj.text =  `This report contains the details of msisdns being sent us over email from Danish.`
            messageObj.attachments = {
                filename: randomReport,
                path: path
            };

            let uploadRes = await uploadFileAtS3(ActiveBase);
            console.log("uploadRes: ", uploadRes);
            if (uploadRes.status) {
                messageObj.attachments.path = uploadRes.data.Location;
                helper.sendToQueue(messageObj);
            }

            // let info = await transporter.sendMail({
            //     from: 'paywall@dmdmax.com.pk',
            //     to:  ["muhammad.azam@dmdmax.com"],
            //     subject: `Complaint Data`, // Subject line
            //     text: `This report contains the details of msisdns being sent us over email from Zara`,
            //     attachments:[
            //         {
            //             filename: randomReport,
            //             path: randomReportFilePath
            //         }
            //     ]
            // });
        }

        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

computeLoggerTotalHoursDataMsisdnWise = async() => {
    console.log("=> computeLoggerTotalHoursDataMsisdnWise");

    let finalResult = [];
    try{
        var jsonPath = path.join(__dirname, '..', 'msisdns.txt');
        let inputData = await readFileSync(jsonPath);
        console.log("### Input Data Length: ", inputData.length);

        let dbConnection = await loggerMsisdnRepo.connect();
        for(let i = 0; i < inputData.length; i++){

            let singObject = { msisdn: inputData[i] };
            singObject.watchTime = 0;
            if(inputData[i] && inputData[i].length === 11){
                console.log("### Request for msisdn: ", inputData[i], i);
                let records = await loggerMsisdnRepo.computeTotalBitratesData(inputData[i], dbConnection);
                console.log('### records: ', records);
                if(records.length > 0){
                    for (let record of records) {
                        console.log('record.totalBitRates: ', record.totalBitRates);
                        singObject.watchTime = Number((Number(record.totalBitRates) * 5)) + Number(singObject.watchTime);
                    }
                }
                else{
                    console.log("### Data not found: ");
                    singObject.watchTime = 0;
                }
            }else{
                singObject.watchTime = 0;
                console.log("### Invalid number or number length: ");
            }

            finalResult.push(singObject);
            console.log('### Done: ')
        }

        console.log("### Finally: ", finalResult);

        if (finalResult.length > 0){

            console.log("### Sending email");
            await loggerMsisdnWiseReportWriter.writeRecords(finalResult);
            let messageObj = {}, path = null;
            messageObj.to = ["muhammad.azam@dmdmax.com"];
            messageObj.subject = `Complaint Data`;
            messageObj.text =  `This report contains the details of msisdns being sent us over email from Danish.`
            messageObj.attachments = {
                filename: randomReport,
                path: path
            };

            let uploadRes = await uploadFileAtS3(randomReport);
            console.log("uploadRes: ", uploadRes);
            if (uploadRes.status) {
                messageObj.attachments.path = uploadRes.data.Location;
                helper.sendToQueue(messageObj);
            }

            // let info = await transporter.sendMail({
            //     from: 'paywall@dmdmax.com.pk',
            //     to:  ["muhammad.azam@dmdmax.com"],
            //     subject: `Complaint Data`, // Subject line
            //     text: `This report contains the details of msisdns being sent us over email from Zara`,
            //     attachments:[
            //         {
            //             filename: randomReport,
            //             path: randomReportFilePath
            //         }
            //     ]
            // });
        }

        fs.unlink(randomReportFilePath,function(err,data) {
            if (err) {
                console.log("###  File not deleted[randomReport]");
            }
            console.log("###  File deleted [randomReport]");
        });
    }catch(e){
        console.log("### error - ", e);
    }
}

computeWatchHoursByViewLogs = async() => {
    console.log("=> computeWatchHoursByViewLogs");

    try{
        let from = '2021-10-01T00:00:00.000Z';
        let to = '2021-10-31T23:59:59.000Z';
        // let payingUsers = await billinghistoryRepo.getPayingUserEngagement(from, to);
        //
        // console.log('payingUsers: ', payingUsers.length);
        //
        // if(payingUsers.length > 0) {

            let watchTime = 0, watchViewCount = 0;
            let dbConnection = await loggerMsisdnRepo.connect();

            let jsonPath = path.join(__dirname, '..', 'msisdns.txt');
            let msisdnList = await readFileSync(jsonPath);
            console.log("### msisdnList Length: ", msisdnList.length);

            for(let i = 0; i < msisdnList.length; i++){

                console.log("### Request for msisdn: ", msisdnList[i], i);
                let records = await loggerMsisdnRepo.computeTotalBitratesData(msisdnList[i], from, to, dbConnection);
                console.log('### records: ', records);
                if(records.length > 0){
                    for (let record of records) {
                        watchTime = (record.totalBitRates * 5) + watchTime;
                        watchViewCount = watchViewCount + record.totalBitratesCount;
                    }
                }
                else{
                    console.log("### Data not found: ", msisdnList[i]);
                }
            }

            console.log('watchTime: ', Number(watchTime / 3600));
            console.log('watchViewCount: ', watchViewCount);
        // }
    }catch(e){
        console.log("### error - ", e);
    }
}

computeDoubleChargeUsers = async () => {
    let from = '2021-09-18T00:00:00.000Z';
    let to = '2021-09-18T23:59:59.000Z';
    let finalResult = [];

    let histories = await billinghistoryRepo.getTodaySuccessfulBilling(from, to);
    console.log('histories: ', histories.length);

    if(histories.length > 0){
        for (let i = 0; i<histories.length; i++){
            let history = histories[i];
            console.log('history: ', history);
            let finalObj = {};
            finalObj.msisdn = history._id;
            if (history.history.length > 0){
                for (let obj of history.history){
                    let hour = Number(obj.hour);
                    if(hour >= 0 && hour < 5){
                        finalObj.cycle_1 = finalObj.cycle_1 ? String(finalObj.cycle_1) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 5 && hour < 8){
                        finalObj.cycle_5 = finalObj.cycle_5 ? String(finalObj.cycle_5) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 8 && hour < 11){
                        finalObj.cycle_8 = finalObj.cycle_8 ? String(finalObj.cycle_8) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 11 && hour < 14){
                        finalObj.cycle_11 = finalObj.cycle_11 ? String(finalObj.cycle_11) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 14 && hour < 17){
                        finalObj.cycle_14 = finalObj.cycle_14 ? String(finalObj.cycle_14) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 17 && hour < 20){
                        finalObj.cycle_17 = finalObj.cycle_17 ? String(finalObj.cycle_17) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 20 && hour < 22){
                        finalObj.cycle_20 = finalObj.cycle_20 ? String(finalObj.cycle_20) + ", " + String(obj.price) : String(obj.price);
                    }
                    if(hour >= 22){
                        finalObj.cycle_22 = finalObj.cycle_22 ? String(finalObj.cycle_22) + ", " + String(obj.price) : String(obj.price);
                    }
                }
            }

            console.log('finalObj: ', finalObj);
            finalResult.push(finalObj);
        }
    }

    if(finalResult.length > 0){
        console.log("### Sending email");
        await doubleChargeReport.writeRecords(finalResult);
        let messageObj = {}, path = null;
        messageObj.to = ["azam.arid1144@gmail.com"];
        messageObj.subject = `Double Charge`;
        messageObj.text =  `Double charge details`;
        messageObj.attachments = {
            filename: randomReport,
            path: path
        };

        let uploadRes = await uploadFileAtS3(randomReport);
        if (uploadRes.status) {
            messageObj.attachments.path = uploadRes.data.Location;
            helper.sendToQueue(messageObj);
        }
    }
}

getArray = async(records) => {
    let ids = [];
    for(let i = 0; i < records.length; i++){
        ids.push(records[i].user_id);
    }
    return ids;
}

module.exports = {
    dailyReport: dailyReport,
    callBacksReport: callBacksReport,
    errorCountReport: errorCountReport,
    dailyUnsubReport: dailyUnsubReport,
    dailyFullAndPartialChargedUsers: dailyFullAndPartialChargedUsers,
    dailyTrialToBilledUsers: dailyTrialToBilledUsers,
    dailyChannelWiseUnsub: dailyChannelWiseUnsub,
    dailyChannelWiseTrialActivated: dailyChannelWiseTrialActivated,
    dailyPageViews: dailyPageViews,
    getTotalUserBaseTillDate: getTotalUserBaseTillDate,
    getExpiredBase: getExpiredBase,
    getInactiveBase: getInactiveBase,
    dailyNetAddition: dailyNetAddition,
    avgTransactionPerCustomer: avgTransactionPerCustomer,
    dailyReturningUsers: dailyReturningUsers,
    weeklyRevenue: weeklyRevenue,
    getActiveBase: getActiveBase,
    getOnlySubscriberIds: getOnlySubscriberIds,
    getReportForHeOrWifi: getReportForHeOrWifi,
    getNextBillingDtm: getNextBillingDtm,
    expireBaseAndBlackList: expireBaseAndBlackList,
    expireBaseAndBlackListOrCreate: expireBaseAndBlackListOrCreate,
    weeklyTransactingCustomers: weeklyTransactingCustomers,
    getExpiredMsisdn: getExpiredMsisdn,
    getWeeklyData: getWeeklyData,
    getDailyData: getDailyData,
    getMigrateUsers: getMigrateUsers,
    getUsersNotSubscribedAfterSubscribe: getUsersNotSubscribedAfterSubscribe,
    generateUsersReportWithTrialAndBillingHistory:generateUsersReportWithTrialAndBillingHistory,
    generateReportForAcquisitionSourceAndNoOfTimeUserBilled:generateReportForAcquisitionSourceAndNoOfTimeUserBilled,
    computeDouMonthlyData:computeDouMonthlyData,
    computeLoggerBitratesDataMsisdnWise:computeLoggerBitratesDataMsisdnWise,
    computeWatchHoursByViewLogs:computeWatchHoursByViewLogs,
    computeLoggerTotalHoursDataMsisdnWise:computeLoggerTotalHoursDataMsisdnWise,
    computeDoubleChargeUsers:computeDoubleChargeUsers,
    getThreeMonthsData: getThreeMonthsData,
    generateReportForAcquisitionRevenueAndSessions: generateReportForAcquisitionRevenueAndSessions
}