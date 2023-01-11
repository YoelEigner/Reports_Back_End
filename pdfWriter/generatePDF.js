const {  reports } = require("./reports");



exports.GeneratePDF = async (res, date, users, action, videoFee, reportType, actionType) => {
    reports(res, date, users, action, videoFee, reportType, actionType)
}