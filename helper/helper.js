const config = require('../config');
const axios = require("axios");

class Helper {
    static setDateWithTimezone(date){
        let newDate = date.toLocaleString("en-US", {timeZone: "Asia/Karachi"});
        newDate = new Date(newDate);
        return newDate;
    }
    
    static getCurrentDate() {
        let now = new Date();
        let strDateTime = [
            [now.getFullYear(),
                this.addZero(now.getMonth() + 1),
                this.addZero(now.getDate())].join("-"),
            [this.addZero(now.getHours()),
                this.addZero(now.getMinutes())].join(":")];
        return strDateTime;
    }

    static addZero(num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    }

    static timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static sendToQueue(messageObj) {
        axios({
            method: 'post',
            url: config.message_service + '/message/email',
            data: messageObj,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        }).then(function(response){
            console.log('response.data: ', response.data);
        }).catch(function(err){
            console.log('err: ', err);
        });
        return true;
    }
}

module.exports = Helper;