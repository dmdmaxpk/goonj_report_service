const mongoose = require('mongoose');
const TPDashboard = mongoose.model('TPDashboard');

class TPDashboardRepository {
    async saveData(data){
        try{
            let tpDash = new TPDashboard(data);
            let result = await tpDash.save();
            console.log("saveData", saveData);
            return result;
        }
        catch(err){
            console.log("saving err:", err);
        }
    }

    async getData(body){
        let {startDate, endDate} = body;
        let result;
        if(startDate && endDate){
            result = await TPDashboard.aggregate([
                    {$match: {date: {$gte: new Date(startDate), $lte: new Date(endDate)}}}
            ]);
        }
        else{
            result = await TPDashboard.find();
        }
        console.log("result", result);
        return result;
    }
};

module.exports = TPDashboardRepository;