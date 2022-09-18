const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.totalAppliedPaymentsTable = (date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours) => {
    return {
        title: "Applied Payments Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Client Payments", renderer: null },
            { label: "Client Hours", renderer: null, align: "center" },
            { label: "Payments From Supervisee's clients", renderer: null, align: "center" },
            { label: "Hours From Supervisee's clients", renderer: null, align: "center" },
            { label: "Total Applied Payments", renderer: null, align: "center" }
        ],
        rows: [[
            formatter.format(clientPayments),
            clientHours,
            formatter.format(superviseeClientsPayment),
            superviseeClientsHours,
            formatter.format(clientPayments + superviseeClientsPayment),
        ]],
    }
}

