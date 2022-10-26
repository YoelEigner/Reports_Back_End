const { getReportedItems, getAssociateProfileById } = require("../sql/sql")
const { getRate } = require("../tables/associateFees")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeDuplicateAndSplitFees } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, non_chargeablesArr, nonChargeableItems, proccessingFeeTypes, videoFee) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            let superviseeReportedItemdData = await getReportedItems(date, worker.associateName)
            let { duplicateItems } = removeDuplicateAndSplitFees(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)
            let superviseeReportedItemsCount = superviseeReportedItemdData.map(x => !non_chargeablesArr.find(n => n === x.event_service_item_name) && x.COUNT).reduce((a, b) => a + b, 0)
            let SuperviseeRate = await getRate(superviseeReportedItemsCount, worker.id)
            let chargeVideoFee = superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0]

            //Create associate fees table
            // make a Set to hold values from namesToDeleteArr
            const itemsToDelete = new Set(nonChargeableItems.concat(duplicateItems));
            const reportedItemDataFiltered = superviseeReportedItemdData.filter((item) => {
                return !itemsToDelete.has(item);
            });

            reportedItemDataFiltered.map(x => x.proccessingFee =
                /*add 0.30 cents to proccessing fee*/(parseFloat(proccessingFeeTypes.find(i => x.receipt_reason.includes(i.name)) !== undefined && proccessingFeeTypes.find(i => x.receipt_reason.includes(i.name)).ammount.replace(/[^0-9]+/, '')) * x.COUNT) +
                /*calculate percentage */(parseFloat(proccessingFeeTypes.find(i => x.receipt_reason.includes(i.name)) !== undefined && proccessingFeeTypes.find(i => x.receipt_reason.includes(i.name)).percentage.replace(/[^0-9.]+/, '')) * x.event_service_item_total) / 100)


            let superviseeFinalProccessingFee = reportedItemDataFiltered.map(x => x.proccessingFee).reduce((a, b) => a + b, 0)
            let superviseeBlocksBiWeeklyCharge = parseFloat(superviseeWorkerProfile.map(x => x.blocksBiWeeklyCharge)[0])
            let superviseeHST = ((superviseeReportedItemsCount * SuperviseeRate) * process.env.HST - (superviseeReportedItemsCount * SuperviseeRate))
            let superviseeAdjustmentFee = JSON.parse(superviseeWorkerProfile.map(x => x.adjustmentFee))


            arr.push(await calculateAssociateFeeForSupervisee(worker.associateName, superviseeReportedItemsCount, parseFloat(SuperviseeRate), videoFee,
                superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge, superviseeHST, superviseeAdjustmentFee, chargeVideoFee))

        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}