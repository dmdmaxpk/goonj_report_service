const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const {Schema} = mongoose;

const subscriptionSchema = new Schema({
    
    //Generating shortid instead of uuid
    _id: { type: ShortId, len: 12, retries: 4},

    user_id: {type: ShortId, required: true},
    paywall_id: {type: ShortId, required: true},
    subscribed_package_id: {type: ShortId, required: true},

    // priority 0 means no priority has been set so far.
    // priority 1 for high and
    // priority 2 for low
    priority: { type: Number, default: 0, index: true },

    subscription_status: String,  // => billed/not_billed/expired/graced/trial
    last_subscription_status: { type: String, default: "none", index: true },
    last_billing_timestamp: Date,
    next_billing_timestamp: Date,
    auto_renewal: { type: Boolean, default: true, index: true },
    total_successive_bill_counts: Number,
    consecutive_successive_bill_counts: Number,

    // Sources
    source: String,
    marketing_source: { type: String, default: 'none' },

    //fields for FnF flow
    is_gray_listed: { type: Boolean, default: false },
    is_black_listed: { type: Boolean, default: false },

    // Affiliation marketing fields
    affiliate_unique_transaction_id: {type:String},
    affiliate_mid: {type:String},
    is_affiliation_callback_executed: { type : Boolean, default: false },
    should_affiliation_callback_sent: Boolean,

    added_dtm: { type: Date, default: Date.now, index: true },
    last_modified: Date,
    queued: { type: Boolean, default: false },
    
    is_discounted: { type: Boolean, default: false },
    discounted_price: { type: Number, default: 0 },

    try_micro_charge_in_next_cycle: { type: Boolean, default: false },
    micro_price_point: { type: Number, default: 0 },
    
    //field for billing
    is_allowed_to_stream: { type: Boolean, default: false },
    is_billable_in_this_cycle: { type: Boolean, default: false },
    date_on_which_user_entered_grace_period: {type: Date},

    amount_billed_today: {type: Number, default: 0},
    is_manual_recharge: { type: Boolean, default: false },
    payment_source: { type: String, index: true, default: "telenor" },
    ep_token: { type: String },
    active: { type: Boolean, default: true, index: true }
}, { strict: true });
subscriptionSchema.index({user_id:1,paywall_id:1},{unique: true});

module.exports = mongoose.model('Subscription', subscriptionSchema);