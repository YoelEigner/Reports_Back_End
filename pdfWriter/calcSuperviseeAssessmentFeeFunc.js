const { getAssociateProfileById, getSuperviseeDataBySuperviser, getPaymentDataForWorkerBySupervisor } = require("../sql/sql")
const { removeNullStr, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI, formatter } = require("./pdfKitFunctions")
const { duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees")


exports.calcSuperviseeAssessmentFeeFunc = (date, respSuperviser, tableType, profileDates, superviser, otherChargableItemsFilterd, otherItemsTableTotals) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            const superviseeotherItemsTable = otherItemsTableTotals[tableType].assessment

            let superviseeReportedItemdData = removeNullStr(await getSuperviseeDataBySuperviser(date, worker.associateName, profileDates, superviser), '-')
            let workerPaymentData = await getPaymentDataForWorkerBySupervisor(worker.associateName, date, profileDates, superviser)

            let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)

            let isSupervised = superviseeWorkerProfile[0].isSupervised
            let isSuperviser = superviseeWorkerProfile[0].isSuperviser
            let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
            let associateType = superviseeWorkerProfile[0].associateType

            let superviseeReportedItemsCount = () => {
                if (tableType === 'CFIR') return calculateWorkerFeeByLeval(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, true, isSuperviser, isSupervised, IsSupervisedByNonDirector);
                else if (tableType === 'CBT') return calculateWorkerFeeByLevalCBT(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, true, isSuperviser, isSupervised, IsSupervisedByNonDirector);
                else if (tableType === 'CPRI') return calculateWorkerFeeByLevalCPRI(associateType, duplicateItemsAndSplitFeesRemoved, workerPaymentData, true, isSuperviser, isSupervised, IsSupervisedByNonDirector);
            }

            let SuperviseeRate = () => {
                if (tableType === 'CFIR') return superviseeWorkerProfile[0].assessmentRate
                else if (tableType === 'CBT') return superviseeWorkerProfile[0].assessmentRate_c
                else if (tableType === 'CPRI') return superviseeWorkerProfile[0].assessmentRate_f
            }

            const otherItemsFee = superviseeotherItemsTable.otherItemsTotal

            const otherItemsQty = superviseeotherItemsTable.invoice_fee_qty

            let totalAssessment = superviseeReportedItemsCount().map(x => x.totalOfAllItems = x.applied_amt ? x.applied_amt : Number(x.TOTAL.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
            let fee = superviseeReportedItemsCount().map(x => x.assessmentAssociateFee = x.applied_amt ? (x.applied_amt / 100) * SuperviseeRate() : (Number(x.TOTAL.replace(/[^0-9.-]+/g, "")) / 100) * SuperviseeRate()).reduce((a, b) => a + b, 0)

            let hst = (fee + otherItemsFee) * (process.env.HST / 100)
            let invoice_fee_qty = superviseeReportedItemsCount().map(x => x.invoice_fee_qty).reduce((a, b) => a + b, 0)

            let superviseeRow = [
                superviseeWorkerProfile[0].associateName,
                superviseeReportedItemsCount().length,
                invoice_fee_qty,
                formatter.format(totalAssessment),
                `${SuperviseeRate()}%`,
                formatter.format(hst),
                formatter.format(fee + otherItemsFee + hst)
            ]

            if (otherItemsQty > 0 || otherChargableItemsFilterd.length > 0) { superviseeRow.splice(3, 0, otherItemsQty, formatter.format(otherItemsFee)) }
            arr.push(superviseeRow)
        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}