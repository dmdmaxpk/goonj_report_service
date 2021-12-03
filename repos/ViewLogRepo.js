const mongoose = require('mongoose');
const ViewLog = mongoose.model('ViewLog');

getLatestViewLog =async(userId) => {
    try {
        let result = await ViewLog.findOne({user_id: userId}).sort({added_dtm: -1}).limit(1);
        return result;
    } catch(error) {
        console.log("=> error", error);
        throw new Error(error.message); 
    }
}

getDaysOfUse = async(userId) => {
    try{
        let result = await ViewLog.aggregate([
        {
            $match:{
                user_id: userId	
            }
        },{
            $group:{
                _id: {"day": {"$dayOfMonth" : "$added_dtm"}, "month": { "$month" : "$added_dtm" },
                            "year":{ $year: "$added_dtm" }}	
            }
        },{
            $project:{
                _id: 0,
                date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
            }
        },{
            $count: "count"
        }
        ]);
        return result;
    }catch(e){
        console.log(e);
    }
}

getDaysOfUseInDateRange = async(userId, from, to) => {
    try{
        let result = await ViewLog.aggregate([
        {
            $match:{
                user_id: userId,
                $and:[
                    {added_dtm:{$gte: new Date(from)}},
                    {added_dtm:{$lte: new Date(to)}}
                ]
            }
        },{
            $group:{
                _id: {"day": {"$dayOfMonth" : "$added_dtm"}, "month": { "$month" : "$added_dtm" },
                            "year":{ $year: "$added_dtm" }}	
            }
        },{
            $project:{
                _id: 0,
                date: {"$dateFromParts": { year: "$_id.year","month":"$_id.month","day":"$_id.day" }},
            }
        },{
            $count: "count"
        }
        ]);
        return result;
    }catch(e){
        console.log(e);
    }
}

getDaysOfUseTotal = async(userId, from, to) => {
    try{
        let result = await ViewLog.aggregate([
        {
            $match:{
                user_id: userId,
                // $and:[
                //     {added_dtm:{$gte: new Date(from)}},
                //     {added_dtm:{$lte: new Date(to)}}
                // ]
            }
        },
        {$group: {
            _id: "null",
            douTotal: {$sum: 1}
        }},
        ]);
        return result;
    }catch(e){
        console.log(e);
    }
}

getDaysOfUseUnique = async(userId, from, to) => {
    try{
        let result = await ViewLog.aggregate([
            { $match:{
                user_id: userId,
                $and:[
                    {added_dtm:{$gte: new Date(from)}},
                    {added_dtm:{$lte: new Date(to)}}
                ]
            }},
            {$project: {
                    day: {"$dayOfMonth" : "$added_dtm"},
                    user_id: "$user_id"
            }},
            {$group: {
                _id: {day: "$day", user_id: "$user_id"},
                dou: {$sum: 1}
                }},
            {$group: {
                _id: {user_id: "$_id.user_id"},
                dou: {$sum: 1}
            }},
            {$project: {
                user_id: "$_id.user_id",
                dou: "$dou"
            }}
        ]);
        return result;
    }catch(e){
        console.log(e);
    }
}

module.exports = {
    getLatestViewLog: getLatestViewLog,
    getDaysOfUse: getDaysOfUse,
    getDaysOfUseInDateRange: getDaysOfUseInDateRange,
    getDaysOfUseUnique: getDaysOfUseUnique,
    getDaysOfUseTotal: getDaysOfUseTotal
}