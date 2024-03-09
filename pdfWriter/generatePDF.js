const {  reports } = require("./reports");



exports.GeneratePDF = async (res, date, users, action, videoFee, reportType, actionType, sites) => {
    reports(res, date, users, action, videoFee, reportType, actionType, sites)
}