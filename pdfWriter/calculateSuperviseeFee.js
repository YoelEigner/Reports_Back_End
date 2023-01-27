const { getAssociateProfileById, getPaymentDataForWorker, getDataDate, getSuperviseeDataBySuperviser, getPaymentDataForWorkerBySupervisor } = require("../sql/sql")
const { getRate, getRate_CBT, getRate_CPRI } = require("../tables/associateFeesTherapy")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeNullStr, removeNaN, calculateProccessingFee, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI, calculateProcessingFeeTemp, getSummarizedData, formatter } = require("./pdfKitFunctions")
const { removeDuplicateAndSplitFees, duplicateAndSplitFees, duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, non_chargeablesArr, nonChargeableItems, proccessingFeeTypes, videoFee, tableType, profileDates, superviser, supervisorsProbono) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)
            let superviserGetsAssessmentMoney =
                (
                    (worker.supervisor1 === superviseeWorkerProfile[0].supervisor1 && superviseeWorkerProfile[0].assessmentMoneyToSupervisorOne)
                    ||
                    (worker.supervisor2 === superviseeWorkerProfile[0].supervisor2 && superviseeWorkerProfile[0].assessmentMoneyToSupervisorTwo)
                )
            let superviserGetsTherapyMoney =
                (
                    (worker.supervisor1 === superviseeWorkerProfile[0].supervisor1 && superviseeWorkerProfile[0].supervisorOneGetsMoney)
                    ||
                    (worker.supervisor2 === superviseeWorkerProfile[0].supervisor2 && superviseeWorkerProfile[0].supervisorTwoGetsMoney)
                )
            let superviseeReportedItemdData = removeNullStr(await getSuperviseeDataBySuperviser(date, worker.associateName, profileDates, superviser), '-')
            let workerPaymentData = await getPaymentDataForWorkerBySupervisor(worker.associateName, date, profileDates, superviser)

            let { duplicateItemsAndSplitFees } = duplicateAndSplitFees(superviseeReportedItemdData)
            let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(superviseeReportedItemdData)

            const itemsToDelete = new Set(nonChargeableItems.concat(duplicateItemsAndSplitFees));
            const reportedItemDataFiltered = workerPaymentData.filter((item) => {
                item.total_amt = item.applied_amt
                return !itemsToDelete.has(item);
            });

            let filteredItems = []
            if (superviserGetsAssessmentMoney && superviserGetsTherapyMoney) {
                filteredItems = reportedItemDataFiltered
            }
            else if (superviserGetsAssessmentMoney && !superviserGetsTherapyMoney) {
                filteredItems = reportedItemDataFiltered.filter(x => x.service_name.startsWith('A__') || x.service_name.startsWith('aa_'))
            }
            else if (!superviserGetsAssessmentMoney && superviserGetsTherapyMoney) {
                filteredItems = reportedItemDataFiltered.filter(x => !x.service_name.startsWith('A__') && !x.service_name.startsWith('aa_'))
            }
            // console.log(filteredItems)

            let summarizedTransactions = Object.values(getSummarizedData(filteredItems)).sort()
            let superviseeFinalProccessingFee = tableType === 'CFIR' ? calculateProcessingFeeTemp(proccessingFeeTypes, summarizedTransactions).filter(x => x.worker === superviseeWorkerProfile[0].associateName).map(x => x.proccessingFee).reduce((a, b) => a + b, 0) : 0

            let probonoItems = superviseeReportedItemdData.filter(x => x.event_service_item_name === 'Counselling 030 + HST' || x.event_service_item_name === 'Counselling 033.90')

            if (superviserGetsTherapyMoney) {
                let isSupervised = superviseeWorkerProfile[0].isSupervised
                let isSuperviser = superviseeWorkerProfile[0].isSuperviser
                let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
                let associateType = superviseeWorkerProfile[0].associateType
                let probonoRate = superviseeWorkerProfile[0].probono




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
                let chargeVideoFee = tableType === 'CFIR' ? superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0] : false



                let superviseeBlocksBiWeeklyCharge = tableType === 'CFIR' ? parseFloat(superviseeWorkerProfile.map(x => x.blocksBiWeeklyCharge)[0]) : 0

                let superviseeAdjustmentFee = tableType === 'CFIR' ? JSON.parse(superviseeWorkerProfile.map(x => x.adjustmentFee)) : [{ name: 'rtest', value: '0' }]
                // console.log(superviser, superviseeReportedItemsCount(), '--', superviseeReportedItemdData.length, '---', workerPaymentData.length)
                arr.push(await calculateAssociateFeeForSupervisee(worker.associateName, superviseeReportedItemsCount(), parseFloat(await SuperviseeRate()), videoFee,
                    superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge, superviseeAdjustmentFee, chargeVideoFee, tableType, probonoRate, probonoItems, supervisorsProbono))
            }
            else if (superviserGetsAssessmentMoney) {
                let row = [
                    superviseeWorkerProfile[0].associateName,
                    0,
                    formatter.format(0),
                    formatter.format(0),
                    formatter.format(superviseeFinalProccessingFee),
                    formatter.format(0),
                    formatter.format(0),
                    formatter.format(0),
                    formatter.format(superviseeFinalProccessingFee)
                ]
                if (probonoItems.length > 0 || supervisorsProbono > 0) { row.splice(3, 0, 0, formatter.format(0),) }
                arr.push(row)
            }

        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}