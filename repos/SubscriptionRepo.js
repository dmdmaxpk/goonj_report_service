const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');

class SubscriptionRepository {
    async getSubscription (subscription_id)  {
        let result = await Subscription.findOne({_id: subscription_id});
        return result;
    }

    async getAllSubscriptions(user_id)  {
        let result = await Subscription.find({user_id: user_id});
        return result;
    }

    async getQueuedCount(user_id)  {
        let result = await Subscription.countDocuments({queued:true});
        return result;
    }

    async getAllSubscriptionsByDate(from, to)  {
        console.log("=> Subs from ", from, "to", to);
        let result = await Subscription.aggregate([
            {
                $match:{
                    $and: [
                                    {added_dtm:{$gte:new Date(from)}},
                                    {added_dtm:{$lte:new Date(to)}}
                           ]
                    }
            },{
                    $group: {
                                _id: {"day": {"$dayOfMonth" : "$added_dtm"}, "month": { "$month" : "$added_dtm" }, "year":{ $year: "$added_dtm" }},
                        count: {$sum: 1}
                            }
            },{ 
                                 $project: { 
                                _id: 0,
                                date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                        count: "$count"
                                 } 
                        },
                        { $sort: { date: 1} }
            ]);
        return result;
    }

    async getSubscriptionsForAffiliateMids(mids, from, to){
        let results = await Subscription.aggregate([
            {
                $match:{
                $or:mids,
                $and:[
                    {added_dtm:{$gt: new Date(from)}}, 
                    {added_dtm:{$lt: new Date(to)}}
                ]
                }
            },{
                $group: {
                    _id: "$affiliate_mid",
                    user_ids: {$addToSet: "$user_id"}
                }
            }
            ]);
        return results;
    }

    async dailyTrialToBilledUsers (from ,to)  {
        let result = await Subscription.aggregate([
        {
            $match:{
                $and:[
                    {added_dtm:{$gt: new Date(from)}}, 
                    {added_dtm:{$lt: new Date(to)}}
                ]
            }
        },{
            $project:{
                _id: 0,
                user_id: 1,
            }
        },{
            $lookup:{
                from: "billinghistories",
                let: {user_id: "$user_id"},
                pipeline:[
                                    {
                                        $match: {
                                                $expr: {
                                $and:[
                                                        {$eq: ["$user_id", "$$user_id"]},
                                                        {$eq: ["$billing_status", "trial"]}
                                ]
                                                }
                                        }
                                    }
                        ],
                as: "history"
            }
        },{
            $unwind: "$history"
        },{
            $project:{
                _id: 0,
                "package_id": "$history.package_id",
                "user_id": "$history.user_id",
                "history.billing_dtm": 1
            }
        },{
            $project:{
                "package_id": "$package_id",
                "user_id": "$user_id",
                "trial_dt": "$history.billing_dtm"
            }
        },{
            $project:{
                "package_id": "$package_id",
                "user_id": "$user_id",
                "trial_date": {"$dayOfMonth" : "$trial_dt"}
            }
        },{
            $lookup:{
                from: "billinghistories",
                let: {user_id: "$user_id", trial_date: "$trial_date"},
                pipeline:[
                                    {
                                        $match: {
                                                $expr: {
                                $and:[
                                                    {$eq: ["$user_id","$$user_id"]},
                                                    {$eq: ["$billing_status","Success"]},
                                {$eq: [{"$dayOfMonth":"$billing_dtm"}, {$add:["$$trial_date",1]}]}
                                ]
                                                }
                                        }
                                    }
                        ],
                as: "history"
            }
        },{
            $project:{
                    package_id: "$package_id",
                historySize: {$size: "$history"}	
            }
        },{
            $match:{
                "historySize": {$gt: 0}	
            }
        },{
            $group:{
                _id: "$package_id",
                count: {$sum: 1}	
            }
        }]);
        return result;
    }

    async getExpiredFromSystem(){
        console.log('=> getExpiredFromSystem');
        try{
            let result = await Subscription.aggregate([
                {             
                    $match:{ 
                        "subscription_status" : "expired"
                    }
                },{
                    $project:{
                        "_id": 0,
                        "user_id": 1
                    }
                },
                {
                    $lookup:{
                        from: "users",
                        let: {user_id: "$user_id"},
                        pipeline:[{$match:{$expr:{$eq:["$_id", "$$user_id"]}}}],
                        as: "userDetails"
                    }
                },{
                    $unwind: "$userDetails"
                },{
                    $project:{
                        "userDetails.msisdn": 1		
                    }
                }
            ]);
            return result;
        }catch(e){
            console.log('=> error', e);
        }
    }

    async getComedyDailySubscriptions(){
        let subscriptions = await Subscription.find({subscribed_package_id: "QDfH", active: true, $or: [{subscription_status: "billed"}, {subscription_status: "graced"}]});
        return subscriptions;
    }

    async getOnlySubscriberIds(source, from, to){
        let data = await Subscription.aggregate([
        {
            $match:{
                source: source,
                $and:[
                    {added_dtm:{$gte: new Date(from)}}, 
                    {added_dtm:{$lt: new Date(to)}},
                ]
            }
        },{
            $project: {
                _id:0,
                user_id: 1
            }
        }
        ]);

        console.log("=> data fetched", data.length);

        return data;
    }
}

module.exports = SubscriptionRepository;