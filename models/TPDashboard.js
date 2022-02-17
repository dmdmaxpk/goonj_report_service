const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const {Schema} = mongoose;

const tpDashboardSchema = new Schema({
    _id: { type: ShortId, len: 4, retries: 4 },

    revenue: Number,
    newPayingUsersAcquiredDaily: Number,
    newPayingUsersAcquiredWeekly: Number,
    renewedPayingUsersDaily: Number,
    renewedPayingUsersWeekly: Number,
    totalChargedUsersDaily: Number,
    totalChargedUsersWeekly: Number,
    totalAttemptedUsersDaily: Number,
    totalAttemptedUsersWeekly: Number,
    unsubbed: Number,
    purged: Number,
    payingUsersAccessedWeb: Number,
    payingUsersAccessedApp: Number,
    totalSessionsWeb: Number,
    totalSessionsApp: Number,

    date: { type: Date, default: Date.now, unique: true }
}, { strict: true })
module.exports = mongoose.model('TPDashboard', tpDashboardSchema);