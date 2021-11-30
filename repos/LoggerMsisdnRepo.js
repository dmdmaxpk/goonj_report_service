var MongoClient = require('mongodb').MongoClient;

let connect = async () => {
    return new Promise(async (resolve, reject) => {
        await MongoClient.connect('mongodb://10.0.1.70:27017/streamlogs',  async function (err, client) {
            if(err){
                console.error(`Database Access Denied : ${err.message}`);
                reject();
            }else{
                let dbConn = await client.db('streamlogs');
                console.log(`Database Connected`);
                resolve(dbConn);
            }
        });
    });
};

let computeBitratesMonthlyData = async (msisdn, startDate, endDate, dbConnection) => {
    return new Promise((resolve, reject) => {
        let match = { $and:[{logDate:{$gte:new Date(startDate)}}, {logDate:{$lte:new Date(endDate)}}] };
        match.msisdn = msisdn;
        dbConnection.collection('msisdnstreamlogs', function (err, collection) {
            if (err) {
                console.log('err: ', err);
                resolve([]);
            }

            collection.aggregate([
                { $match: match},
                { $project: {
                        bitrate: "$bitrateCount",
                        logMonth: { $month: "$logDate" },
                    }
                },
                { $group: {
                        _id: {logMonth: "$logMonth"},
                        totalBitRates: { $sum: "$bitrate" }
                    }
                }
            ],{ allowDiskUse: true }).toArray(function(err, items) {
                if(err){
                    console.log('computeBitratesMonthlyData - err: ', err.message);
                    resolve([]);
                }
                resolve(items);
            });

        });
    });
};

let computeTotalBitratesData = async (msisdn, dbConnection) => {
    return new Promise((resolve, reject) => {
        let match = {};
        match.msisdn = msisdn;
        // match.source = 'vod';
        // match.platform = 'android';
        // match.logDate = {$gte: new Date(from), $lte: new Date(to)};

        console.log('match: ', match);
        dbConnection.collection('msisdnstreamlogs', function (err, collection) {
            if (err) {
                console.log('err: ', err);
                resolve([]);
            }

            collection.aggregate([
                { $match: match},
                { $project: {
                        bitrate: "$bitrateCount",
                    }
                },
                { $group: {
                        _id: "bitrates",
                        totalBitRates: { $sum: "$bitrate" },
                        totalBitratesCount: { $sum: 1 }
                    }
                }
            ],{ allowDiskUse: true }).toArray(function(err, items) {
                if(err){
                    console.log('computeTotalBitratesData - err: ', err.message);
                    resolve([]);
                }
                resolve(items);
            });

        });
    });
};

module.exports = {
    connect: connect,
    computeBitratesMonthlyData: computeBitratesMonthlyData,
    computeTotalBitratesData: computeTotalBitratesData,
}