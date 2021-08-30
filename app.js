const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Import database models
require('./models/User');
require('./models/OTP');
require('./models/ViewLog');
require('./models/Subscription');
require('./models/BillingHistory');

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

const RabbitMq = require('./rabbit/RabbitMq');
const rabbitMq = new RabbitMq().getInstance();

// Start Server
let { port } = config;
app.listen(port, () => {
    console.log(`APP running on port ${port}`);
    rabbitMq.initServer((error, response) => {
        if(error){
            console.error(error)
        }else{
            console.log('RabbitMq status', response);
        }
    });
});