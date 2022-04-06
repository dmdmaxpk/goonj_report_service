const TPDashboardRepository = require('../repos/TPDashboardRepo');
const { tpDashboardReportMonthly } = require('../services/ReportsService');
const tpDashRepo = new TPDashboardRepository();

exports.getTPStats = async(req, res) => {
    let result = await tpDashRepo.getData(req.query);
    res.send(result);
}

exports.calMonth = async(req, res) => {
    let result = await tpDashboardReportMonthly();
    res.send(result);
}