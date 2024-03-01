const { formatter } = require("../pdfWriter/pdfKitFunctions");

const formatterCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});


exports.calculateAssociateFeeForSupervisee = async (workerName, reportedItems, rate, videoFee, superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge,
    superviseeAdjustmentFee, chargeVideoFee, tableType, otherItemsRate, otherItemsQty, supervisorsOtherItems, l1SupPrac) => {

    let vidFee = chargeVideoFee ? Number(videoFee) : 0
    let adjustmentFee = superviseeAdjustmentFee.map(x => Number(x.value)).reduce((a, b) => a + b, 0)

    let totalWoHST = ((reportedItems - otherItemsQty) * rate) + (otherItemsQty * otherItemsRate) + superviseeBlocksBiWeeklyCharge
    let hst = totalWoHST * (process.env.HST / 100)
    if (l1SupPrac) { hst = 0 }

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
    if (otherItemsQty > 0 || supervisorsOtherItems > 0) { cfirArr.splice(3, 0, otherItemsQty, formatter.format(otherItemsRate)) }

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