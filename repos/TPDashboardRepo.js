const mongoose = require('mongoose');
const TPDashboard = mongoose.model('TPDashboard');

class TPDashboardRepository {
    async saveData(data){
        let tpDash = new TPDashboard(data);
        let result = await tpDash.save();
        return result;
    }

    async getData(){
        
    }
};

module.exports = TPDashboardRepository;