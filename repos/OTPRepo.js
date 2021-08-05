const mongoose = require('mongoose');
const OTP = mongoose.model('Otp');

getOtp = async(msisdn) => {
    let result = await OTP.findOne({msisdn: msisdn});
	return result;
}

deleteUser = async(msisdn) => {
    const result = await OTP.deleteOne({msisdn: msisdn});
    return result;
}

module.exports = {
    getOtp: getOtp,
    deleteUser: deleteUser
}