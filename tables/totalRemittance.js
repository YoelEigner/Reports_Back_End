const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.totalRemittance = (date, associateTotal, netAppliedPayments, finalAssociateAssessmentFees) => {
    let newTotal = 0
    let fees = Number(associateTotal + finalAssociateAssessmentFees)
    let feeHeaders = "CFIR invoice total\n (Subtotal + Associateship Fees)"
    newTotal = netAppliedPayments - fees

    return {
        title: "Total Remittance",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "NET APPLIED PAYMENTS \n(from Payment Report)", renderer: null, align: "center" },
            { label: feeHeaders, renderer: null, align: "center" },
            { label: "New Total", renderer: null, align: "center" },
        ],
        rows: [[formatter.format(netAppliedPayments), formatter.format(fees), formatter.format(newTotal)]],
    }
}