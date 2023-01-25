const { getAssociateProfileById, getPaymentDataForWorker, getDataDate, getSuperviseeDataBySuperviser, getPaymentDataForWorkerBySupervisor } = require("../sql/sql")
const { getRate, getRate_CBT, getRate_CPRI } = require("../tables/associateFeesTherapy")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeNullStr, removeNaN, calculateProccessingFee, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI, calculateProcessingFeeTemp, getSummarizedData } = require("./pdfKitFunctions")
const { removeDuplicateAndSplitFees, duplicateAndSplitFees, duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, non_chargeablesArr, nonChargeableItems, proccessingFeeTypes, videoFee, tableType, profileDates, superviser) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {

            let superviseeReportedItemdData = removeNullStr(await getSuperviseeDataBySuperviser(date, worker.associateName, profileDates, superviser), '-')
            let workerPaymentData = await getPaymentDataForWorkerBySupervisor(worker.associateName, date, profileDates, superviser)

            let { duplicateItemsAndSplitFees } = duplicateAndSplitFees(superviseeReportedItemdData)
            let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)

            let isSupervised = superviseeWorkerProfile[0].isSupervised
            let isSuperviser = superviseeWorkerProfile[0].isSuperviser
            let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
            let associateType = superviseeWorkerProfile[0].associateType


            let superviseeReportedItemsCount = () => {
                if (tableType === 'CFIR') return calculateWorkerFeeByLeval(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
                else if (tableType === 'CBT') return calculateWorkerFeeByLevalCBT(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
                else if (tableType === 'CPRI') return calculateWorkerFeeByLevalCPRI(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length;
            }

            let SuperviseeRate = async () => {
                if (tableType === 'CFIR') return await getRate(superviseeReportedItemsCount(), worker.id)
                else if (tableType === 'CBT') return await getRate_CBT(superviseeReportedItemsCount(), worker.id)
                else if (tableType === 'CPRI') return await getRate_CPRI(superviseeReportedItemsCount(), worker.id)
            }

            // if(worker.associateName=== 'Peters (AM-LH), Joshua'){
            //     console.log(superviseeReportedItemdData, worker.associateName)

            // }

            let chargeVideoFee = tableType === 'CFIR' ? superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0] : false

            const itemsToDelete = new Set(nonChargeableItems.concat(duplicateItemsAndSplitFees));
            const reportedItemDataFiltered = workerPaymentData.filter((item) => {
                item.total_amt = item.applied_amt
                return !itemsToDelete.has(item);
            });
            let summarizedTransactions = Object.values(getSummarizedData(reportedItemDataFiltered)).sort()

            let superviseeFinalProccessingFee = tableType === 'CFIR' ? calculateProcessingFeeTemp(proccessingFeeTypes, summarizedTransactions).filter(x => x.worker === superviseeWorkerProfile[0].associateName).map(x => x.proccessingFee).reduce((a, b) => a + b, 0) : 0
            let superviseeBlocksBiWeeklyCharge = tableType === 'CFIR' ? parseFloat(superviseeWorkerProfile.map(x => x.blocksBiWeeklyCharge)[0]) : 0

            let superviseeAdjustmentFee = tableType === 'CFIR' ? JSON.parse(superviseeWorkerProfile.map(x => x.adjustmentFee)) : [{ name: 'rtest', value: '0' }]
            // console.log(superviser, superviseeReportedItemsCount(), '--', superviseeReportedItemdData.length, '---', workerPaymentData.length)
            arr.push(await calculateAssociateFeeForSupervisee(worker.associateName, superviseeReportedItemsCount(), parseFloat(await SuperviseeRate()), videoFee,
                superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge, superviseeAdjustmentFee, chargeVideoFee, tableType))
        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}