const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const {Schema} = mongoose;

const subscriberSchema = new Schema({
    _id: { type: ShortId, len: 8, retries: 4 },
    user_id: {type: ShortId, required: true, unique: true},
    added_dtm: { type: Date, default: Date.now, index: true },
    should_remove: Boolean, // temporary field
    last_modified: Date
}, { strict: true })

module.exports = mongoose.model('Subscriber', subscriberSchema);