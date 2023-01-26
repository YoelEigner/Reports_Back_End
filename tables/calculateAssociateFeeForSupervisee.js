const { formatter } = require("../pdfWriter/pdfKitFunctions");

const formatterCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});


exports.calculateAssociateFeeForSupervisee = async (workerName, reportedItems, rate, videoFee, superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge,
    superviseeAdjustmentFee, chargeVideoFee, tableType, probonoRate, probonoItems, supervisorsProbono) => {
    let vidFee = chargeVideoFee ? Number(videoFee) : 0
    let adjustmentFee = superviseeAdjustmentFee.map(x => Number(x.value)).reduce((a, b) => a + b, 0)

    let probonoQty = probonoItems.length
    

    let totalWoHST = ((reportedItems - probonoQty) * rate) + (probonoQty * probonoRate) + superviseeBlocksBiWeeklyCharge

    // let totalWoHST = (reportedItems * rate) + superviseeBlocksBiWeeklyCharge
    let hst = totalWoHST * (process.env.HST / 100)
    let total = totalWoHST + hst

    let cfirArr = [
        workerName,
        reportedItems,
        formatterCurrency.format(rate),
        formatterCurrency.format(vidFee),
        formatterCurrency.format(superviseeFinalProccessingFee),
        formatterCurrency.format(adjustmentFee),
        formatterCurrency.format(superviseeBlocksBiWeeklyCharge),
        formatterCurrency.format(hst),
        formatterCurrency.format(totalWoHST + hst + vidFee + superviseeFinalProccessingFee + superviseeBlocksBiWeeklyCharge + adjustmentFee)
    ]
    if (probonoQty > 0 || supervisorsProbono > 0) { cfirArr.splice(3, 0, probonoQty, formatter.format(probonoRate),) }

    if (tableType === 'CFIR') {
        return cfirArr
    }
    else {
        return [
            workerName,
            reportedItems,
            formatterCurrency.format(rate),
            formatterCurrency.format(hst),
            formatterCurrency.format(total)
        ]
    }

}