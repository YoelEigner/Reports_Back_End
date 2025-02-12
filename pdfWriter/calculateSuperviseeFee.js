const { getAssociateProfileById, getSuperviseeDataBySuperviser, getPaymentDataForWorkerBySupervisor } = require("../sql/sql")
const { OtherChargablesTable, otherItemsTableTotalsCalculation } = require("../tables/OtherChargablesTable.js")
const { getRate, getRate_CBT, getRate_CPRI } = require("../tables/associateFeesTherapy")
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js")
const { removeNullStr, calculateWorkerFeeByLeval, calculateProcessingFeeTemp, getSummarizedData, formatter, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI } = require("./pdfKitFunctions")
const { duplicateAndSplitFees, duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees")


exports.calculateSuperviseeFeeFunc = (date, respSuperviser, nonChargeableItems, proccessingFeeTypes, videoFee, tableType, profileDates, superviser,
    otherChargableItems, otherChargableItemsFilterd, otherItems) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            const otherItemsTable = await OtherChargablesTable(otherChargableItemsFilterd, date, otherItems, worker)
            const otherItemsTableTotals = await otherItemsTableTotalsCalculation(reject, otherItemsTable)
                .catch(error => {
                    throw error;
                });

            const superviseeotherItemsTable = otherItemsTableTotals[tableType].therapy

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

            let summarizedTransactions = Object.values(getSummarizedData(filteredItems)).sort()
            let superviseeFinalProccessingFee = tableType === 'CFIR' ? calculateProcessingFeeTemp(proccessingFeeTypes, summarizedTransactions).filter(x => x.worker === superviseeWorkerProfile[0].associateName).map(x => x.proccessingFee).reduce((a, b) => a + b, 0) : 0

            let otherChargables = superviseeReportedItemdData.filter(x => otherChargableItems.includes(x.event_service_item_name))

            if (superviserGetsTherapyMoney) {
                let isSupervised = superviseeWorkerProfile[0].isSupervised
                let isSuperviser = superviseeWorkerProfile[0].isSuperviser
                let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
                let associateType = superviseeWorkerProfile[0].associateType
                let l1SupPrac = superviseeWorkerProfile[0].associateType === 'L1 (Sup Prac)'




                let superviseeReportedItemsCount = () => {
                    const calculationToUse = tableType === 'CFIR'
                        ? calculateWorkerFeeByLeval
                        : tableType === 'CBT'
                            ? calculateWorkerFeeByLevalCBT
                            : tableType === 'CPRI'
                                ? calculateWorkerFeeByLevalCPRI
                                : calculateWorkerFeeByLeval

                    let superviseeItemLength = calculationToUse(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, false,
                        isSuperviser, isSupervised, IsSupervisedByNonDirector).length ?? 0;
                    let invoiceFeeQty = superviseeotherItemsTable?.invoice_fee_qty ?? 0;

                    return Math.max(0, superviseeItemLength - invoiceFeeQty);
                }

                let SuperviseeRate = async () => {
                    if (tableType === 'CFIR') return await getRate(superviseeReportedItemsCount(), worker.id)
                    else if (tableType === 'CBT') return await getRate_CBT(superviseeReportedItemsCount(), worker.id)
                    else if (tableType === 'CPRI') return await getRate_CPRI(superviseeReportedItemsCount(), worker.id)
                }

                let chargeVideoFee = tableType === 'CFIR' ? superviseeWorkerProfile.map(x => x.cahrgeVideoFee)[0] : false


                let superviseeBlocksBiWeeklyCharge = tableType === 'CFIR' ? parseFloat(superviseeWorkerProfile.map(x => x.blocksBiWeeklyCharge)[0]) : 0

                let superviseeAdjustmentFee = tableType === 'CFIR' ? JSON.parse(superviseeWorkerProfile.map(x => x.adjustmentFee)) : [{ name: '', value: '0' }]
                let rowItem = await calculateAssociateFeeForSupervisee(worker.associateName, superviseeReportedItemsCount(), parseFloat(await SuperviseeRate()), videoFee,
                    superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge, superviseeAdjustmentFee, chargeVideoFee, tableType,
                    superviseeotherItemsTable.otherItemsTotal, superviseeotherItemsTable.invoice_fee_qty,
                    otherChargableItemsFilterd.length, l1SupPrac)
                arr.push(rowItem)
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
                if (otherChargables.length > 0 || otherChargableItemsFilterd.length > 0) { row.splice(3, 0, 0, formatter.format(0),) }
                arr.push(row)
            }

        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}