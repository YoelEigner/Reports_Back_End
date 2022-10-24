const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate, getProcessingFee, getPaymentTypes } = require("../sql/sql")

exports.getRate = async (count, workerId) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    if (associateFees[0] !== undefined) {
        if (count >= 34) {
            return associateFees[0].associateFeeBaseRateOverrideGreaterThen
        }
        else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen) !== 0 && count <= 33) {
            return associateFees[0].associateFeeBaseRateOverrideLessThen
        }
        else {
            return associateFees[0].associateFeeBaseRate
        }
    }
}
exports.associateFees = async (worker, count, date, workerId, videoFee, finalProccessingFee, blocksBiWeeklyCharge, ajustmentFees, superviseeFeeCalculation, chargeVideoFee) => {
    let rate = await this.getRate(count, workerId)
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