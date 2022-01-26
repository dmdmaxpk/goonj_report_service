const mongoose = require('mongoose');
const BillingHistory = mongoose.model('BillingHistory');
const Subscription = mongoose.model('Subscription');
const moment = require('moment');

class BillingHistoryRepository {
    constructor(){
    }

    async getExpiryHistory(user_id) {
        let result = await BillingHistory.aggregate([{             
            $match:{ 
                "user_id": user_id,
                $or:[
                    {"billing_status" : "expired"}, 
                    {"billing_status" : "unsubscribe-request-recieved"}, 
                    {"billing_status" : "unsubscribe-request-received-and-expired"}
                ]
            }
        }]);
        console.log("expired history", result);
        return result;
    }

    async getBillingDataForSpecificSubscriberIds(user_ids){
        let result = await BillingHistory.aggregate([
            { 
                $match:{ 
                    "user_id": {$in : user_ids},
                    $or: [{"billing_status": 'Success'}, {"billing_status": 'trial'}]
                }
            }
            ]);
        return result;
    }


    async getTodaySuccessfulBilling(from, to){

        console.log('getTodaySuccessfulBilling - from and to : ', from, to);
        let result = await BillingHistory.aggregate([
            { $match:{
                "billing_status": "Success",
                $and:[
                    {billing_dtm:{$gte: new Date(from)}},
                    {billing_dtm:{$lte: new Date(to)}},
                ],
            }},
            { $project:{
                price: "$price",
                msisdn: "$msisdn",
                hour: { "$hour" : "$billing_dtm"},
            }},
            { $project:{
                hour: "$hour",
                price: "$price",
                msisdn: "$msisdn"
            }},
            {$group:{
                _id: "$msisdn",
                history: { $push:  { price: "$price", hour: "$hour"}}
            }},
            {$project: {
                msisdn: "$_id.msisdn",
                history: "$history",
                sizeOfHistory: {$size: "$history"}
            }},
            { $match: {
                "sizeOfHistory": {$gt: 1}
            }}
        ]);
        console.log('result: ', result);

        return result;
    }

    async getChargingDetails(input, from, to){
        console.log("=> billinghistory - getChargingDetails - ",input.length);
        let data = await BillingHistory.aggregate([
        {
        
            $match:{
                $and:[
                    {billing_dtm:{$gt: new Date(from)}}, 
                    {billing_dtm:{$lt: new Date(to)}},
                ],
                user_id: {$in: input},
                billing_status: "Success"
            }
        },{
            $group:{
                _id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                            "year":{ $year: "$billing_dtm" }},
                count: {$sum: 1}	
            }
        },{
            $project:{
                _id: 0,
                date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                count: "$count"
            }
        },{
            $sort:{
                date: 1	
            }
        }
        ]);
        return data;
    }

    async billingInLastHour  ()  {
        let todayOneHourAgo = new Date(); //step 1 
        todayOneHourAgo.setHours(todayOneHourAgo.getHours()-1);
        let billingCountInLastHour = await BillingHistory.find({"billing_dtm": {$gte: todayOneHourAgo},$or: [{billing_status:"Success"},{billing_status: "graced"}] }).count();
        return billingCountInLastHour;
    }
    
    async errorCountReportBySource ()  {
        console.time("errorCountReportBySource");
       let result = await Subscription.aggregate([ {
            $match:{
                added_dtm: {$gte: new Date("2020-06-10T00:00:00.000Z")}
            }},
           {$lookup:{
                           from: "billinghistories",
                           localField: "user_id",
                           foreignField: "user_id",
                           as: "histories"
                         }
            }, { 
                $project: { 
                            source: 1,
                            histories:  
                            { 
                                $filter: { 
                                input: "$histories",
                                as:"history",
                                cond: {
                                        $or: [ { $eq: ['$$history.billing_status',"graced"] } ] 
                                        } 
                                }
                            }
                        }
            }, {
                $unwind: "$histories" 
             }, {
                $group: { 
                            _id: {
                                    source: "$source", 
                                    errorMessage: "$histories.operator_response.errorMessage", 
                                    errorCode: "$histories.operator_response.errorCode" 
                                }, 
                            count: {$sum: 1} 
                        }
            }, {
                $project: { 
                            source: "$_id.source",
                            errorMessage: "$_id.errorMessage", 
                            errorCode: "$_id.errorCode",
                            count: "$count"  
                          } 
            }
            , {
                $sort: { "source": -1 }
            }
        ]);
        console.timeEnd("errorCountReportBySource");
        return result;
    }
    
    async errorCountReport  ()  {
        console.time("errorCountReport");
        let result = await Subscription.aggregate([ {
                $match:{
                    added_dtm: {$gte: new Date("2020-06-10T00:00:00.000Z")}
                },
                 $lookup:{
                            from: "billinghistories",
                            localField: "user_id",
                            foreignField: "user_id",
                            as: "histories"
                          }
             }, { 
                 $project: { 
                             source: 1,
                             histories:  
                             { 
                                 $filter: { 
                                 input: "$histories",
                                 as:"history",
                                 cond: {
                                         $or: [ { $eq: ['$$history.billing_status',"graced"] } ] 
                                         } 
                                 }
                             }
                         }
             }, {
                 $unwind: "$histories" 
              }, {
                 $group: { 
                             _id: {
                                     errorMessage: "$histories.operator_response.errorMessage", 
                                     errorCode: "$histories.operator_response.errorCode" 
                                 }, 
                             count: {$sum: 1} 
                         }
             }, {
                 $project: { 
                             errorMessage: "$_id.errorMessage", 
                             errorCode: "$_id.errorCode",
                             count: "$count"  
                           } 
             }
             , {
                 $sort: { count: -1 }
             }
         ]);
         console.timeEnd("errorCountReport");
         return result;
    }
    
    async dailyUnsubReport () {
        console.log("[dailyUnsubReport]");
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    $or:[
                        {"billing_status": "expired"}, 
                        {"billing_status": "unsubscribe-request-received-and-expired"}
               ]
                }
            },{
                $group: {
                    _id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                    "year":{ $year: "$billing_dtm" },source:"$source"},
                    count:{$sum: 1} 
                }
            },{ 
                $project: { 
                    date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                    source: "$_id.source",
                    count:"$count"
                } 
            },
            { $sort: { date: -1} }
            ]);
            console.log("[dailyUnsubReport][reached]",result);
         return result;
    }

    async unsubReport (from, to) {
        console.log("=> Unsub from ", from, "to", to);
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    $or:[
                                    {"billing_status": "expired"}, 
                                    {"billing_status": "unsubscribe-request-received-and-expired"}
                           ], $and: [
                                    {billing_dtm:{$gte:new Date(from)}},
                                    {billing_dtm:{$lte:new Date(to)}}
                           ]
                    }
            },{
                    $group: {
                                _id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" }, "year":{ $year: "$billing_dtm" }},
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

    async numberOfTransactions (from, to) {
        console.log("=> numberOfTransactions from ", from, "to", to);
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    "billing_status": "Success",
                    $and: [
                        {billing_dtm:{$gte:new Date(from)}}, 
                        {billing_dtm:{$lte:new Date(to)}}
                    ]
                }
            },{$count:"count"}
            ]);
        return result;
    }

    async numberOfTransactionsOfSpecificSubscriber(user_id, from, to) {
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    "user_id": user_id,
                    "billing_status": "Success",
                    $and: [
                        {billing_dtm:{$gte:new Date(from)}}, 
                        {billing_dtm:{$lte:new Date(to)}}
                    ]
                }
            },{$count:"count"}
            ]);
        return result;
    }

    async getRevenueGeneratedByPerUser(user_id, from, to) {
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    "user_id": user_id,
                    "billing_status": "Success"
                    // $and: [
                    //     {billing_dtm:{$gte:new Date(from)}}, 
                    //     {billing_dtm:{$lte:new Date(to)}}
                    // ]
                }
            },
            {
                $group:{
                    _id: "null",
                    revenue: {$sum: "$price"},
                    count: {$sum: 1}
                }
            }
            ]);
        return result;
    }

    async totalUniqueTransactingUsers (from, to) {
        console.log("=> totalUniqueTransactingUsers from ", from, "to", to);
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    "billing_status": "Success",
                    $and: [
                        {billing_dtm:{$gte:new Date(from)}}, 
                        {billing_dtm:{$lte:new Date(to)}}
                    ]
                    
                }
            },{
                $group:{
                    _id: "$user_id",
                    count: {$sum: 1}	
                }
            },{$count:"count"}
            ]);
        return result;
    }

    async dailyReturningUsers (from, to) {
        console.log("=> dailyReturningUsers from ", from, "to", to);
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    micro_charge: false,
                    billing_status: "Success",
                    $and: [
                        {billing_dtm:{$gte:new Date(from)}},
                        {billing_dtm:{$lte:new Date(to)}}
                            ]
                    }
            },{
                $group: {
                    _id: "$user_id",
                    count: {$sum: 1}
                }
            }, {
                $match: {
                    "count":{
                        $gt: 1	
                    }
                }
            }, {
                $count: "totalcount"
            }
            ]);            
        return result;
    }
    
    async dailyChannelWiseUnsub ()  {
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    $or:[{"billing_status" : "unsubscribe-request-recieved"}, {"billing_status" : "unsubscribe-request-received-and-expired"}],
                    "billing_dtm": {$gte:new Date("2020-06-10T00:00:00.000Z")},
                    "operator": "telenor"
                }
            },{
                $group:{
                    _id: {"user_id": "$user_id", "source": "$source", "day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" }, "year":{ $year: "$billing_dtm" }}
                }
            },{ 
                     $project: { 
                    _id: 0,
                    source: "$_id.source",
                    user_id: "$_id.user_id",
                            date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }}
                     } 
            },{
                $group:{
                    _id: {"date": "$date", "source": "$source"},
                    count: {$sum: 1}	
                }
            },{ 
                     $project: { 
                    _id: 0,
                            date: "$_id.date",
                    source: "$_id.source",
                    count: "$count"
                     } 
            },
            { $sort: { date: -1} }
            ]);
         return result;
    }
    
    async dailyChannelWiseTrialActivated () {
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    billing_status: "trial",
                    "billing_dtm": {$gte:new Date("2020-04-01T00:00:00.000Z")}
                }
            },{
                $group: {
                        _id: {"source":"$source", "day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                        "year":{ $year: "$billing_dtm" }},
                        count:{$sum: 1} 
                }
            },{ 
                $project: {
                _id: 0,
                source: "$_id.source",
                    date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                    count:"$count" 
                } 
            },
            { $sort: { date: -1} }
            ]);
         return result;
    }
    
    async dailyExpiredBySystem ()  {
        let result = await BillingHistory.aggregate([
            {
                $match:{
                    "billing_status" : "expired",
            "billing_dtm": {$gte:new Date("2020-06-10T00:00:00.000Z")},
            "operator_response": {$exists: true}
                }
            },{
                $group: {
                    _id: {"user_id":"$user_id", "day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },
                    "year":{ $year: "$billing_dtm" }},
                    count:{$sum: 1} 
                }
            },{ 
                $project: { 
                    date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                    count:"$count" 
                } 
            },{ 
                $group: { 
                    _id: "$date",
                    count:{$sum: 1} 
                } 
            },{ 
                $project: {
            _id: 0, 
                    date: "$_id",
                    count:"$count" 
                } 
            },
            { $sort: { date: -1} }
            ]);
         return result;
    }

    async getDailyFullyChargedAndPartialChargedUsers ()  {
        let result = await BillingHistory.aggregate([{
            $match: {
                "billing_status": "Success",
                "billing_dtm": {$gte: new Date("2020-06-10T00:00:00.000Z")}
            }
        },{
            $group: {
                _id: {"day": {"$dayOfMonth" : "$billing_dtm"}, "month": { "$month" : "$billing_dtm" },"year":{ $year: "$billing_dtm"}, "micro_charge_state": "$micro_charge"}, 
                count:{ $sum: 1 } 
            } 
        },{
            $project: {
                _id: 0,
                micro_charge_state: "$_id.micro_charge_state",
                        date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
                        total: "$count"
            }
        },{ 
            $sort: { 
                date: -1
            } 
        }]);
         return result;
    }

    async getUsersNotSubscribedAfterSubscribe()  {
        console.log("=> executing query");
        try{
            let result = await BillingHistory.aggregate([
                {
                    $match:{
                        "billing_status": "Success",
                        $and:[
                            {billing_dtm:{$gte:new Date("2020-08-01T00:00:00.000Z")}},
                            {billing_dtm:{$lt:new Date("2020-07-31T00:00:00.000Z")}}
                        ]
                        }
                },{
                    $group: {
                        _id: "$user_id"
                    }
                },{
                    $lookup:{
                        from: "billinghistories",
                        let: {user_id: "$_id" },
                        pipeline:[
                            {
                                $match: {
                                        $expr: {
                                                $and:[
                                                    {$eq: ["$user_id", "$$user_id"]},
                                                    {$ne: ["$billing_status", "Success"]},
                
                                                    {$and: [
                                                            {$gte: ["$billing_dtm", new Date("2020-08-01T00:00:00.000Z")]},
                                                            {$lte: ["$billing_dtm", new Date("2020-08-30T00:00:00.000Z")]}
                                                        ]
                                                    }
                                                ]
                                        }
                                }
                            }
                        ],
                        as: 'billing_activities'	
                    }
                },{
                    $project:{
                        _id: 1,
                        isAnyTrue: { $anyElementTrue: [ "$billing_activities" ] }	
                    }
                },{
                    $match:{
                        "isAnyTrue": true	
                    }
                },{
                    $lookup:{
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "usersdata"
                    }
                },{
                    $unwind: "$usersdata"
                },{
                    $project: {
                        msisdn: "$usersdata.msisdn"
                    }
                }
            ]);

            console.log("=> ", result);
            return result;
        }catch(err){
            console.log("=>", err);
        }
    }

    async getSuccessfullChargedUsers(mPackage)  {
        try{
            if(mPackage === 'QDfC'){
                let result = await BillingHistory.find({package_id:mPackage,billing_status: 'Success', $and:[{billing_dtm:{$gte:new Date("2021-03-22T00:00:00.000Z")}},{billing_dtm:{$lte:new Date("2021-03-23T00:00:00.000Z")}}]});
                return result;
            }else{
                let result = await BillingHistory.find({package_id:mPackage,billing_status: 'Success', $and:[{billing_dtm:{$gte:new Date("2021-03-16T00:00:00.000Z")}},{billing_dtm:{$lte:new Date("2021-03-17T00:00:00.000Z")}}]});
                return result;
            }
        }catch(err){
            console.log("=>", err);
        }
    }

    async getUnsuccessfullChargedUsers(id, mPackage)  {
        try{
            let result = await BillingHistory.findOne({user_id: id, package_id: mPackage, billing_status: 'Success', $and: [{billing_dtm:{$gte:new Date("2021-03-23T00:00:00.000Z")}},{billing_dtm:{$lte:new Date("2021-03-24T00:00:00.000Z")}}]});
            return result;
        }catch(err){
            console.log("###", err);
        }
    }

    async getMigratedUsers(from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                {
                    $match:{
                        'operator_response.errorMessage': "The subscriber does not exist or the customer that the subscriber belongs to is being migrated. Please check.",
                        $and:[
                            {billing_dtm:{$gt: new Date(from)}},
                            {billing_dtm:{$lt: new Date(to)}}
                        ]
                    }
                },
                { $group:{ _id: "$user_id" }}
            ]);

            return result;
        }catch(err){
            console.log("###", err);
        }
    }

    async getLastHistory(user_id, mPackage)  {
        try{
            let result = await BillingHistory.find({user_id: user_id, package_id: mPackage, $and: [{billing_dtm:{$gte:new Date("2021-03-23T00:00:00.000Z")}},{billing_dtm:{$lte:new Date("2021-03-24T00:00:00.000Z")}}]}).sort({billing_dtm:-1}).limit(1);
            return result;
        }catch(err){
            console.log("###", err);
        }
    }

    async getSuccessfulChargedUsers(startDate, endDate)  {
        console.log('getSuccessfulChargedUsers: ', startDate, endDate);

        try{
            let result = await BillingHistory.aggregate([
                    { $match:{
                            billing_status: "Success",
                            $and:[{billing_dtm:{$gte:new Date(startDate)}}, {billing_dtm:{$lte:new Date(endDate)}}]
                        }},
                    { $project: {
                            "user_id": "$user_id"
                    }},
                    {$group: {
                        _id: { user_id: "$user_id"}
                    }},
                    { $project: {
                        "user_id": "$_id.user_id"
                    }},
                ]);
            return result;
        }catch(err){
            console.log("###", err);
        }
    }

    async getPayingUserEngagement(startDate, endDate)  {
        console.log('getPayingUserEngagement: ', startDate, endDate);

        try{
            let result = await BillingHistory.aggregate([
                {
                    $match:{
                        "billing_status": "Success",
                        "source": "app",
                        $and:[{billing_dtm:{$gte:new Date(startDate)}}, {billing_dtm:{$lte:new Date(endDate)}}]
                    }
                },{
                    $group:{
                        _id: {user_id: "$user_id"}
                    }
                },{
                    $lookup:{
                        from: "viewlogs",
                        let: {user_id: "$_id.user_id"},
                        pipeline:[
                            { $match: {
                                $expr: {
                                    $and:[
                                        {$eq: ["$user_id", "$$user_id"]},
                                        {$and: [
                                                {$gte: ["$added_dtm", new Date(startDate)]},
                                                {$lte: ["$added_dtm", new Date(endDate)]}
                                            ]
                                        }
                                    ]
                                }
                            }},
                            {$limit: 1}
                        ],
                        as: "user_data"
                    }
                },{
                    $unwind: "$user_data"
                },{
                    $project:{
                        "_id": 0,
                        "msisdn": "$user_data.msisdn"
                    }
                }
            ]);

            console.log('result: ', result);

            return result;
        }catch(err){
            console.log("###", err);
        }
    }

    async getExpiryHistory(user_id) {
        let result = await BillingHistory.aggregate([{             
            $match:{ 
                "user_id": user_id,
                $or:[
                    {"billing_status" : "expired"}, 
                    {"billing_status" : "unsubscribe-request-recieved"}, 
                    {"billing_status" : "unsubscribe-request-received-and-expired"}
                ]
            }
        }]);
        console.log("expired history", result);
        return result;
    }

    setDateWithTimezone(date){
        return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
    }

    async getRevenueInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([ { $match: { 
                "billing_status": "Success",
                $and:[
                    {"billing_dtm":{$gt: new Date(from)}}, 
                    {"billing_dtm":{$lte: new Date(to)}}
                ]            
                } },
                { $project: { _id: 0, "price": "$price" } },{ $group: {          _id: null,          total: {              $sum: "$price"          }      }  } ]);
                console.log("=> ", result);
             return result;
        }catch(err){
            console.log("=>", err);
        }
    }

    async getThreeMonthsData ()  {
        try{
            let aggregate = BillingHistory.aggregate(
                [
                    {
                        $match:{
                            "billing_status": "Success",
                            $and:[
                                {billing_dtm:{$gte: new Date("2021-07-01T00:00:00.000Z")}}, 
                                {billing_dtm:{$lt: new Date("2021-10-01T00:00:00.000Z")}}
                            ]
                        }
                    },{
                        $group:{
                            _id: "$user_id",
                            revenue_per_user: {$sum: "$price"},
                            count: {$sum:1}
                        }
                    },{
                        $lookup:{
                            from: "viewlogs",
                            let: {user_id: "$_id"},
                            pipeline:[
                                    {
                                $match: {
                                    $expr: {
                                        $and:[
                                            {$eq: ["$user_id", "$$user_id"]},
                                            {$and: [
                                                {$gte: ["$added_dtm", new Date("2021-07-01T00:00:00.000Z")]},
                                                {$lte: ["$added_dtm", new Date("2021-10-01T00:00:00.000Z")]}
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                            ],
                            as: "user_data"
                        }
                    },{
                        $project:{
                            revenue_per_user: "$revenue_per_user",
                            accessed_logs: {$size: "$user_data"},
                            subscribers: "$count"
                        }
                    },{
                        $group:{
                            _id: "$accessed_logs",
                            subscribers: {$sum: 1},
                            revenue: {$sum: "$revenue_per_user"}
                        }
                    }
                    ]
            );
            aggregate.options = { allowDiskUse: true };
            let result = await aggregate.exec();

            console.log("#@#", result);
            return result;
        }catch(err){
            console.log("#@#", err);
        }
    }

    async getRequests(from, to)  {
        try{
            let result = await BillingHistory.aggregate([
            {
                $match:{
                $or:[
                    {billing_status: "Success"}, 
                    {billing_status: "graced"}
                ],
                $and:[
                    {billing_dtm:{$gt: new Date(from)}}, 
                    {billing_dtm:{$lte: new Date(to)}}
                ]
                }
            },{
                $count: "sum"
            }
            ]);

            console.log("=> ", result);
             return result;
        }catch(err){
            console.log("=>", err);
        }
    }

    async getRevenueStatsDateWise(from, to){

        console.log('from, to : ',from, to);
        let dataArr = [];
        //Get day and month for date
        let todayDay = moment(from).format('DD');
        let todayMonth = moment(from).format('MMM');

        //Push Date
        dataArr.push({'date': todayDay+ ' ' +todayMonth});
        console.log('date: ', JSON.stringify(dataArr))

        /*
        * Compute Revenue
        * */
        let revenue =  await this.getRevenueInDateRange(from, to);
        if (revenue.length > 0){
            revenue = revenue[0];
            dataArr.push({"revenue": revenue.total})
        }
        else{
            dataArr.push({"revenue": 0})
        }

        console.log('revenue: ', JSON.stringify(dataArr))

        /*
        * Get Total Count
        * */
        let requestCount =  await this.getBillingRequestCountInDateRange(from, to);
        if (requestCount.length > 0){
            requestCount = requestCount[0];
            dataArr.push({"total_requests": requestCount.total})
        }
        else{
            dataArr.push({"total_requests": 0})
        }
        console.log('requestCount: ', JSON.stringify(dataArr))

        /*
        * Get success and expire - subscription status
        * */
        let statusWise =  await this.getBillingStatsStatusWiseInDateRange(from, to);
        let successful = {'successful_charged': 0}, unsubscribed = {'unsubscribe_requests': 0};
        for (let i = 0; i< statusWise.length; i++){
            if (statusWise[i]._id === 'Success')
                successful.successful_charged = statusWise[i].total;
            else if (statusWise[i]._id === 'expired')
                unsubscribed.unsubscribe_requests = statusWise[i].total;
        }
        dataArr.push(successful);
        dataArr.push(unsubscribed);
        console.log('statusWise: ', JSON.stringify(dataArr))

        /*
        * Get Insufficient Balance
        * */
        let insufficientBalance =  await this.getBillingInsufficientBalanceInDateRange(from, to);
        if (insufficientBalance.length > 0){
            insufficientBalance = insufficientBalance[0];
            dataArr.push({"insufficient_balance": insufficientBalance.total})
        }
        else{
            dataArr.push({"insufficient_balance": 0})
        }
        console.log('insufficientBalance: ', JSON.stringify(dataArr))

        return dataArr;
    }

    async getBillingRequestCountInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        $or:[
                            {billing_status: "Success"},
                            {billing_status: "graced"}
                        ],
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: null, total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingRequestCountInDateRange - err =>", err);
        }
    }

    async getBillingStatsStatusWiseInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: "$billing_status", total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingStatsStatusWiseInDateRange - err =>", err);
        }
    }

    async getBillingInsufficientBalanceInDateRange (from, to)  {
        try{
            let result = await BillingHistory.aggregate([
                { $match: {
                        "operator_response.errorMessage": "The account balance is insufficient.",
                        $and:[
                            {"billing_dtm":{$gt: new Date(from)}},
                            {"billing_dtm":{$lte: new Date(to)}}
                        ]
                    }},
                { $group: {
                        _id: null, total: { $sum: 1 }
                    }}
            ]);
            return result;
        }catch(err){
            console.log("getBillingInsufficientBalanceInDateRange - err =>", err);
        }
    }
    
    async findTrial(user_id){
        try{
            let result = await BillingHistory.findOne({user_id, billing_status: "trial"});
            return result;
        }
        catch{
            console.log("error finding trial data")
        }
    }

    async getFirstChargingDetail(user_id){
        try{
            let result = await BillingHistory.findOne({user_id, billing_status: "Success"});
            return result;
        }
        catch{
            console.log("error finding trial data")
        }
    }
}

module.exports = BillingHistoryRepository;