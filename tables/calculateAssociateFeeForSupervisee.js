const formatterCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});


exports.calculateAssociateFeeForSupervisee = async (workerName, reportedItems, rate, videoFee, superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge,
    superviseeAdjustmentFee, chargeVideoFee, tableType) => {
    let vidFee = chargeVideoFee ? Number(videoFee) : 0
    let adjustmentFee = superviseeAdjustmentFee.map(x => Number(x.value)).reduce((a, b) => a + b, 0)
    let totalWoHST = (reportedItems * rate) + superviseeBlocksBiWeeklyCharge
    // let totalWoHST = (reportedItems * rate) + vidFee + superviseeFinalProccessingFee + superviseeBlocksBiWeeklyCharge + adjustmentFee
    let hst = totalWoHST * (process.env.HST / 100)
    let total = totalWoHST + hst
    // let resp = await getReportedItems(date, worker.associateName)

    if (tableType === 'CFIR') {
        return [
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
    }
    else {
        return [
            workerName,
            reportedItems,
            formatterCurrency.format(rate),
            // formatterCurrency.format(vidFee),
            // formatterCurrency.format(adjustmentFee),
            formatterCurrency.format(hst),
            formatterCurrency.format(total)
        ]
    }

}