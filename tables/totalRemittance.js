const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.totalRemittance = (date, associateTotal, netAppliedPayments, workerProfile) => {
    let newTotal = 0
    let fees = Number(associateTotal)
    let feeHeaders = "CFIR invoice total\n (Subtotal + Associateship Fees)"
    newTotal = netAppliedPayments - fees

    //*************#4 calculation L1 supervised practice ***************/
    if (workerProfile[0].associateType === 'L1 (Supervised Practice)') {
        feeHeaders = "HST + Ajustment Fees"
        fees = netAppliedPayments * process.env.HST - netAppliedPayments
        newTotal = netAppliedPayments - fees
    }
    //***************#3 calculation ALL non director supervised ****************/
    else if (workerProfile[0].associateType !== 'L1 (Supervised Practice)' && workerProfile[0].IsSupervisedByNonDirector === true) {
    }
    //***************#2 calculation L3 & L4 supervised by director ****************/

    else if (workerProfile[0].IsSupervisedByNonDirector === false
        && workerProfile[0].isSupervised === true && workerProfile[0].associateType === 'L3' || workerProfile[0].associateType === 'L4') {
        fees = netAppliedPayments * process.env.HST - netAppliedPayments
        newTotal = 0
        feeHeaders = 'HST'
    }





    return {
        title: "Total Remittance",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "NET APPLIED PAYMENTS (from Payment Report)", renderer: null, align: "center" },
            { label: feeHeaders, renderer: null, align: "center" },
            { label: "New Total", renderer: null, align: "center" },
        ],
        rows: [[formatter.format(netAppliedPayments), '-' + formatter.format(fees), formatter.format(newTotal)]],
    }
}