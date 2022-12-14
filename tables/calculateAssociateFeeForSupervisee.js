const formatterCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});


exports.calculateAssociateFeeForSupervisee = async (workerName, reportedItems, rate, videoFee, superviseeFinalProccessingFee, superviseeBlocksBiWeeklyCharge,
    superviseeHST, superviseeAdjustmentFee, chargeVideoFee, tableType) => {
    let vidFee = chargeVideoFee ? Number(videoFee) : 0
    let adjustmentFee = superviseeAdjustmentFee.map(x => Number(x.value)).reduce((a, b) => a + b, 0)
    let total = (reportedItems * rate) * process.env.HST + vidFee + superviseeFinalProccessingFee + superviseeBlocksBiWeeklyCharge + adjustmentFee
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
            formatterCurrency.format(superviseeHST),
            formatterCurrency.format(total)
        ]
    }
    else{
        return [
            workerName,
            reportedItems,
            formatterCurrency.format(rate),
            formatterCurrency.format(vidFee),
            formatterCurrency.format(adjustmentFee),
            formatterCurrency.format(superviseeHST),
            formatterCurrency.format(total)
        ]
    }

}