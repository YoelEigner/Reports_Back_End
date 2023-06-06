const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.totalAppliedPaymentsTable = (date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours, ajustmentFeesTotal,
    totalAppliedAmount, totalSupPracAmount, totalSupPraHours, totalAppliedHrs) => {

    let superviseeHrs = (superviseeClientsHours - totalAppliedHrs) + totalSupPraHours
    let total = clientPayments + ((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount) + ajustmentFeesTotal
    
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
            clientHours.toFixed(1),
            formatter.format((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount),
            superviseeHrs.toFixed(1),
            formatter.format(ajustmentFeesTotal),
            formatter.format(total),
        ]],
    }
}




