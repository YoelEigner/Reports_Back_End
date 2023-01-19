const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.totalAppliedPaymentsTable = (date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours, ajustmentFeesTotal, totalAppliedAmount, totalSupPracAmount, totalSupPraHours, totalAppliedHrs) => {
    let superviseePaymentAmt = (superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount
    let superviseeHrs = (superviseeClientsHours - totalAppliedHrs) + totalSupPraHours
    let total = clientPayments + superviseePaymentAmt + ajustmentFeesTotal

    // let total = clientPayments + ((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount) + -190 

    return {
        title: "Applied Payments Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Client Payments", renderer: null, align: "center" },
            { label: "Client Hours", renderer: null, align: "center" },
            { label: "Payments From Supervisee's clients", renderer: null, align: "center" },
            { label: "Hours From Supervisee's clients", renderer: null, align: "center" },
            { label: "Adjustment Fees", renderer: null, align: "center" },
            { label: "Total Applied Payments", renderer: null, align: "center" }
        ],
        rows: [[
            formatter.format(clientPayments),
            clientHours.toFixed(0),
            formatter.format(superviseePaymentAmt),
            superviseeHrs.toFixed(0),
            formatter.format(ajustmentFeesTotal),
            formatter.format(total),
        ]],
    }
}

