const { getReportedItems, getAssociateProfileById, getPaymentDataForWorker, getDataDate } = require("../sql/sql")
const { getRate } = require("../tables/associateFeesTherapy")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeNullStr, removeNaN, calculateProccessingFee, calculateWorkerFeeByLeval } = require("./pdfKitFunctions")
const { removeDuplicateAndSplitFees } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, non_chargeablesArr, nonChargeableItems, proccessingFeeTypes, videoFee) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            let superviseeReportedItemdData = removeNullStr(await getDataDate(date, worker.associateName), '-')
            let workerPaymentData = await getPaymentDataForWorker(worker.associateName, date)

            let { duplicateItems } = removeDuplicateAndSplitFees(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)
            let isSupervised = superviseeWorkerProfile[0].isSupervised
            let isSuperviser = superviseeWorkerProfile[0].isSuperviser
            let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
            let associateType = superviseeWorkerProfile[0].associateType
            let superviseeReportedItemsCount = calculateWorkerFeeByLeval(associateType, superviseeReportedItemdData, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
            //  superviseeReportedItemdData.map(x => !non_chargeablesArr.find(n => n === x.service_name) && x.COUNT).reduce((a, b) => a + b, 0)
            let SuperviseeRate = await getRate(superviseeReportedItemsCount, worker.id)
            let chargeVideoFee = superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0]

            //Create associate fees table
            // make a Set to hold values from namesToDeleteArr
            const itemsToDelete = new Set(nonChargeableItems.concat(duplicateItems));
            const reportedItemDataFiltered = workerPaymentData.filter((item) => {
                item.total_amt = item.applied_amt
                return !itemsToDelete.has(item);
            });

            let superviseeFinalProccessingFee = calculateProccessingFee(reportedItemDataFiltered, proccessingFeeTypes, superviseeWorkerProfile[0].associateType).reduce((a, b) => a + b, 0)

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