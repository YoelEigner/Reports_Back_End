const { getAssociateProfileById, getPaymentDataForWorker, getDataDate } = require("../sql/sql")
const { getRate, getRate_CBT, getRate_CPRI } = require("../tables/associateFeesTherapy")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeNullStr, removeNaN, calculateProccessingFee, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI } = require("./pdfKitFunctions")
const { removeDuplicateAndSplitFees, duplicateAndSplitFees } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, non_chargeablesArr, nonChargeableItems, proccessingFeeTypes, videoFee, tableType, profileDates) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {

            let superviseeReportedItemdData = removeNullStr(await getDataDate(date, worker.associateName, profileDates), '-')
            let workerPaymentData = await getPaymentDataForWorker(worker.associateName, date, profileDates)

            let { duplicateItemsAndSplitFees } = duplicateAndSplitFees(superviseeReportedItemdData)

            // let { duplicateItems } = removeDuplicateAndSplitFees(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)
            let isSupervised = superviseeWorkerProfile[0].isSupervised
            let isSuperviser = superviseeWorkerProfile[0].isSuperviser
            let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
            let associateType = superviseeWorkerProfile[0].associateType

            let superviseeReportedItemsCount = () => {
                if (tableType === 'CFIR') return calculateWorkerFeeByLeval(associateType, superviseeReportedItemdData, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
                else if (tableType === 'CBT') return calculateWorkerFeeByLevalCBT(associateType, superviseeReportedItemdData, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
                else if (tableType === 'CPRI') return calculateWorkerFeeByLevalCPRI(associateType, superviseeReportedItemdData, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
            }

            let SuperviseeRate = async () => {
                if (tableType === 'CFIR') return await getRate(superviseeReportedItemsCount(), worker.id)
                else if (tableType === 'CBT') return await getRate_CBT(superviseeReportedItemsCount(), worker.id)
                else if (tableType === 'CPRI') return await getRate_CPRI(superviseeReportedItemsCount(), worker.id)
            }
            let chargeVideoFee = superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0]

            //Create associate fees table
            // make a Set to hold values from namesToDeleteArr
            const itemsToDelete = new Set(nonChargeableItems.concat(duplicateItemsAndSplitFees));
            const reportedItemDataFiltered = workerPaymentData.filter((item) => {
                item.total_amt = item.applied_amt
                return !itemsToDelete.has(item);
            });

            // let superviseeFinalProccessingFee = calculateProccessingFee(reportedItemDataFiltered, proccessingFeeTypes, superviseeWorkerProfile[0].associateType).reduce((a, b) => a + b, 0)
            let superviseeFinalProccessingFee = tableType === 'CFIR' ? calculateProccessingFee(reportedItemDataFiltered, proccessingFeeTypes, superviseeWorkerProfile[0].associateType).reduce((a, b) => a + b, 0) : 0

            let superviseeBlocksBiWeeklyCharge = parseFloat(superviseeWorkerProfile.map(x => x.blocksBiWeeklyCharge)[0])
            let superviseeHST = ((superviseeReportedItemsCount() * await SuperviseeRate()) * process.env.HST - (superviseeReportedItemsCount() * await SuperviseeRate()))
            let superviseeAdjustmentFee = JSON.parse(superviseeWorkerProfile.map(x => x.adjustmentFee))


            arr.push(await calculateAssociateFeeForSupervisee(worker.associateName, superviseeReportedItemsCount(), parseFloat(await SuperviseeRate()), videoFee,
                superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge, superviseeHST, superviseeAdjustmentFee, chargeVideoFee, tableType))
        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}