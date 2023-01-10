const { formatter, isSuperviserOne, removeNaN } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate, getProcessingFee, getPaymentTypes } = require("../sql/sql")

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
                let amount = [associateFees[0].associateFeeBaseRate_c, associateFees[0].associateFeeBaseRateOverrideGreaterThen_c,
                associateFees[0].associateFeeBaseRateOverrideLessThen_c]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_c),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRateTwo_c, associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c,
                associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRateTwo_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateTwo_c),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c)
                }
            }
            else {
                let amount = [associateFees[0].associateFeeBaseRate_c, associateFees[0].associateFeeBaseRateOverrideGreaterThen_c,
                associateFees[0].associateFeeBaseRateOverrideLessThen_c]
                return {
                    isSuperviser: true,
                    isZero: Number(associateFees[0].associateFeeBaseRate_c) == 0,
                    associateRate: 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            if (associateFees[0].supervisorOneGetsMoney) { return Number(associateFees[0].associateFeeBaseRate_c) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c) }
            else if (associateFees[0].supervisorTwoGetsMoney) { return Number(associateFees[0].associateFeeBaseRateTwo_c) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c) }
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_c)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo_c)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_c)
                }
            }
        }
    }
}
exports.associateFeesTherapyCBT = async (worker, count, date, workerId, videoFee, finalProccessingFee, blockItemFees, ajustmentFees, superviseeFeeCalculation, chargeVideoFee, L1AssociateFee) => {
    let rate = await getRate(count, workerId, false, L1AssociateFee)
    let vidFee = chargeVideoFee ? Number(videoFee) : 0

    return {
        title: "CBT Associate Fees (Therapy Only)",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "Video Fee", renderer: null, align: "center" },
            { label: "Adjustment Fee", renderer: null, align: "center" },
            // { label: "Blocks Charge Fee", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                formatter.format(rate),
                formatter.format(vidFee),
                formatter.format(ajustmentFees.toFixed(2)),
                formatter.format(((count * rate) * process.env.HST - (count * rate)).toFixed(2)),
                formatter.format((count * rate) * process.env.HST + vidFee + ajustmentFees)
            ],
            ...superviseeFeeCalculation
        ],
    }
}