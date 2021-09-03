const env = process.env.NODE_ENV || 'production';

const codes = {
    code_error: -1,
    code_success: 0,
    code_record_added: 1,
    code_record_updated: 2,
    code_record_deleted: 3,

    code_invalid_data_provided: 4,
    code_record_already_added: 5,
    code_data_not_found: 6,

    code_otp_validated: 7,
    code_otp_not_validated: 8,
    code_already_subscribed: 9,
    code_in_billing_queue: 10,
    code_trial_activated: 11,
    code_user_gralisted: 12,
    code_user_blacklisted: 13,
    code_auth_failed: 14,
    code_auth_token_not_supplied: 15,
    code_already_in_queue: 16,
    code_otp_not_found: 17
}

const message_service = 'http://10.0.1.76:3003';
const goonj_core_baseurl = 'http://10.0.1.76:3000';

const rabbitMqConnectionString = 'amqp://127.0.0.1';
const queueNames = {
    emailDispatcher: 'emailDispatcher'
}
let config = {
    development: {
        port: 3009,
        mongoDB: 'mongodb://10.0.1.88:27017/goonjpaywall',
        codes: codes,
        queueNames: queueNames,
        message_service: message_service,
        goonj_core_baseurl: goonj_core_baseurl,
        rabbitMqConnectionString: rabbitMqConnectionString
    },
    staging: {
        port: 3009,
        mongoDB: 'mongodb://10.0.1.88:27017/goonjpaywall',
        codes: codes,
        queueNames: queueNames,
        message_service: message_service,
        goonj_core_baseurl: goonj_core_baseurl,
        rabbitMqConnectionString: rabbitMqConnectionString
    },
    production: {
        port: 3009,
        mongoDB: 'mongodb://10.0.1.88:27017/goonjpaywall',
        codes: codes,
        queueNames: queueNames,
        message_service: message_service,
        goonj_core_baseurl: goonj_core_baseurl,
        rabbitMqConnectionString: rabbitMqConnectionString
    }
};

console.log("---", env);

if (env === 'development') config = config.development;
if (env === 'staging') config = config.staging;
if (env === 'production') config = config.production;

module.exports = config;
