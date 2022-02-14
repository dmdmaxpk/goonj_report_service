const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');

// Import database models
require('./models/User');
require('./models/OTP');
require('./models/ViewLog');
require('./models/Subscription');
require('./models/BillingHistory');
require('./models/TPDashboard');

const config = require('./config');

// Connection to Database
mongoose.connect(config.mongoDB, {useUnifiedTopology: true, useCreateIndex: true, useNewUrlParser: true});
mongoose.connection.on('error', err => console.error(`Error: ${err.message}`));

const app = express();

// Middlewares
app.use(bodyParser.json({limit: '50mb'})); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(logger('dev'));

// Import routes
app.use('/', require('./routes/index'));


var CronJob = require('cron').CronJob;
var job = new CronJob('30 5 * * *', function() {
    axios.get(config.base_path + "/cron/generateDailyReport")
        .then(function(response){
            console.log('paywall daily - response.data: ', response.data);
        })
        .catch(function(err){
            console.log('paywall daily - err: ', err);
        });
}, null, true, 'Asia/Karachi');
job.start();


const reportsService = require('./services/ReportsService');
var CronJob = require('cron').CronJob;
var tpDashboardCron = new CronJob('0 1 * * *', async function() {
    await reportsService.tpDashboardReport();
    console.log('TP Dashboard cron executed');
}, null, true, 'Asia/Karachi');
tpDashboardCron.start();


const RabbitMq = require('./rabbit/RabbitMq');
const rabbitMq = new RabbitMq().getInstance();

// Start Server
let { port } = config;
app.listen(port, () => {
    console.log(`APP running on port ${port}`);

    rabbitMq.initServer(config.queueNames.emailDispatcher, (error, response) => {
        if(error){
            console.error(error)
        }else{
            console.log('RabbitMq status', response);
        }
    });
});