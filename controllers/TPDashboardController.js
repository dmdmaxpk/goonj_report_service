const TPDashboardRepository = require('../repos/TPDashboardRepo');
const tpDashRepo = new TPDashboardRepository();

exports.getTPStats = async(req, res) => {
    let result = await tpDashRepo.getData(req.query);
    res.send(result);
}