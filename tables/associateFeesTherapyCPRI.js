const { formatter, isSuperviserOne, removeNaN } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate, getProcessingFee, getPaymentTypes } = require("../sql/sql")
const { getRate_CPRI } = require("./associateFeesTherapy")

const isNum = (num) => {
    if (isNaN(num)) { return 0 }
    else { return num }

}

const getRatesForL1 = (arr) => {
    return arr.map(x => x !== undefined ? Number(x.replace(/[^0-9.-]+/g, "")) : 0).reduce((a, b) => a + b, 0)
}

const getRate = async (count, workerId, getSubPrac, L1AssociateFee) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    // const isSUperviserOne = await isSuperviserOne(worker)

    if (associateFees[0] !== undefined) {
        if (getSubPrac) {
            if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorOneGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRate_f, associateFees[0].associateFeeBaseRateOverrideGreaterThen_f,
                associateFees[0].associateFeeBaseRateOverrideLessThen_f]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_f),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRateTwo_f, associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f,
                associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRateTwo_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateTwo_f),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f)
                }
            }
            else {
                let amount = [associateFees[0].associateFeeBaseRate_f, associateFees[0].associateFeeBaseRateOverrideGreaterThen_f,
                associateFees[0].associateFeeBaseRateOverrideLessThen_f]
                return {
                    isSuperviser: true,
                    isZero: Number(associateFees[0].associateFeeBaseRate_f) == 0,
                    associateRate: 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            if (associateFees[0].supervisorOneGetsMoney) { return Number(associateFees[0].associateFeeBaseRate_f) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f) }
            else if (associateFees[0].supervisorTwoGetsMoney) { return Number(associateFees[0].associateFeeBaseRateTwo_f) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f) }
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_f)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo_f)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_f)
                }
            }
        }
    }
}
exports.associateFeesTherapyCPRI = async (worker, count, date, workerId, superviseeFeeCalculation, removedNonChargablesArr) => {
    let rate = await getRate_CPRI(removedNonChargablesArr, workerId, false)

    let totalWoHST = (count * rate)
    let hst = totalWoHST * (process.env.HST / 100)

    return {
        title: "CPRI Associate Fees (Therapy Only)",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                formatter.format(rate),
                // formatter.format(vidFee),
                // formatter.format(ajustmentFees.toFixed(2)),
                formatter.format(hst),
                formatter.format(totalWoHST + hst)
            ],
            ...superviseeFeeCalculation
        ],
    }
}
