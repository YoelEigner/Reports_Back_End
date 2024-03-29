const { getAssociateProfileById, getSuperviseeDataBySuperviser, getPaymentDataForWorkerBySupervisor } = require("../sql/sql")
const { OtherChargablesTable } = require("../tables/OtherChargablesTable")
const { removeNullStr, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI, formatter, getSummarizedData, calculateProcessingFeeTemp } = require("./pdfKitFunctions")
const { duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees")


exports.calcSuperviseeAssessmentFeeFunc = (date, respSuperviser, tableType, profileDates, superviser, proccessingFeeTypes,
    otherChargableItems, otherChargableItemsFilterd, otherItems) => {
    let arr = []
    return new Promise((resolve, reject) => {
        let loop = respSuperviser.map(async (worker) => {
            const superviseeotherItemsTable = ((await OtherChargablesTable(otherChargableItemsFilterd, date, otherItems, worker)).otherItemsTotal)

            let superviseeReportedItemdData = removeNullStr(await getSuperviseeDataBySuperviser(date, worker.associateName, profileDates, superviser), '-')
            let workerPaymentData = await getPaymentDataForWorkerBySupervisor(worker.associateName, date, profileDates, superviser)

            let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(superviseeReportedItemdData)

            let superviseeWorkerProfile = await getAssociateProfileById(worker.id)

            let isSupervised = superviseeWorkerProfile[0].isSupervised
            let isSuperviser = superviseeWorkerProfile[0].isSuperviser
            let IsSupervisedByNonDirector = superviseeWorkerProfile[0].IsSupervisedByNonDirector
            let associateType = superviseeWorkerProfile[0].associateType
            // let superviserGetsAssessmentMoney =
            //     (worker.supervisor1 === superviseeWorkerProfile[0].supervisor1) && superviseeWorkerProfile[0].assessmentMoneyToSupervisorOne
            //     ||
            //     (worker.supervisor2 === superviseeWorkerProfile[0].supervisor2) && superviseeWorkerProfile[0].assessmentMoneyToSupervisorTwo


            // console.log(superviserGetsAssessmentMoney)
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

            let otherItemsFee = () => {
                if (tableType === 'CFIR') return superviseeotherItemsTable.totalAmtCFIR
                else if (tableType === 'CBT') return superviseeotherItemsTable.totalAmtCBT
                else if (tableType === 'CPRI') return superviseeotherItemsTable.totalAmtCPRI
            }

            let otherItemsQty = () => {
                if (tableType === 'CFIR') return superviseeotherItemsTable.totalQtyCFIR
                else if (tableType === 'CBT') return superviseeotherItemsTable.totalQtyCBT
                else if (tableType === 'CPRI') return superviseeotherItemsTable.totalQtyCPRI
            }

            // let assessmentPaymentData = workerPaymentData.filter(x => x.service_name.startsWith('A__') || x.service_name.startsWith('aa_'))
            // let summarizedTransactions = Object.values(getSummarizedData(assessmentPaymentData)).sort()

            // let assessmentProccessingFee = tableType === 'CFIR' ? calculateProcessingFeeTemp(proccessingFeeTypes, summarizedTransactions).filter(x => x.worker === superviseeWorkerProfile[0].associateName).map(x => x.proccessingFee).reduce((a, b) => a + b, 0) : 0

            let totalAssessment = superviseeReportedItemsCount().map(x => x.totalOfAllItems = x.applied_amt ? x.applied_amt : Number(x.TOTAL.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
            let fee = superviseeReportedItemsCount().map(x => x.assessmentAssociateFee = x.applied_amt ? (x.applied_amt / 100) * SuperviseeRate() : (Number(x.TOTAL.replace(/[^0-9.-]+/g, "")) / 100) * SuperviseeRate()).reduce((a, b) => a + b, 0)

            let hst = (fee + otherItemsFee()) * (process.env.HST / 100)
            let invoice_fee_qty = superviseeReportedItemsCount().map(x => x.invoice_fee_qty).reduce((a, b) => a + b, 0)

            let superviseeRow = [
                superviseeWorkerProfile[0].associateName,
                superviseeReportedItemsCount().length,
                invoice_fee_qty,
                formatter.format(totalAssessment),
                `${SuperviseeRate()}%`,
                formatter.format(hst),
                formatter.format(fee + otherItemsFee() + hst)
            ]

            if (otherItemsQty() > 0 || otherChargableItemsFilterd.length > 0) { superviseeRow.splice(3, 0, otherItemsQty(), formatter.format(otherItemsFee())) }
            arr.push(superviseeRow)
        })
        Promise.all(loop).then(() => {
            resolve(arr)
        })
    })
}