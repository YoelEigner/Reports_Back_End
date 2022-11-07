const { formatter, isSuperviserOne, removeNaN } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate, getProcessingFee, getPaymentTypes } = require("../sql/sql")

const isNum = (num) => {
    if (isNaN(num)) { return 0 }
    else { return num }

}

exports.getRate = async (count, workerId, getSubPrac) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    // const isSUperviserOne = await isSuperviserOne(worker)
    if (associateFees[0] !== undefined) {
        if (getSubPrac) {
            if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorOneGetsMoney) {
                return { one: true, superviser: associateFees[0].associateFeeBaseRate, CFIR: associateFees[0].associateFeeBaseRateOverrideGreaterThen }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                return { one: false, superviser: associateFees[0].associateFeeBaseRateTwo, worker: associateFees[0].associateFeeBaseRateOverrideLessThenTwo }
            }
            else {
                return { one: false, superviser: 0, worker: 0, CFIR: 0 }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            return 0
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate)
                }
            }
        }
    }
}
exports.associateFees = async (worker, count, date, workerId, videoFee, finalProccessingFee, blocksBiWeeklyCharge, ajustmentFees, superviseeFeeCalculation, chargeVideoFee) => {
    let rate = await this.getRate(count, workerId, false)
    let vidFee = chargeVideoFee ? Number(videoFee) : 0
    return {
        title: "Associate Fees",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "Video Fee", renderer: null, align: "center" },
            { label: "Other Fee", renderer: null, align: "center" },
            { label: "Adjustment Fee", renderer: null, align: "center" },
            { label: "Blocks Charge Fee", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                formatter.format(rate),
                formatter.format(vidFee),
                formatter.format(finalProccessingFee.toFixed(2)),
                formatter.format(ajustmentFees.toFixed(2)),
                formatter.format(blocksBiWeeklyCharge.toFixed(2)),
                formatter.format(((count * rate) * process.env.HST - (count * rate)).toFixed(2)),
                formatter.format((count * rate) * process.env.HST + vidFee + finalProccessingFee + blocksBiWeeklyCharge + ajustmentFees)
            ],
            ...superviseeFeeCalculation
        ],
    }
}