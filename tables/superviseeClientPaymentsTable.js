const { sortByName, formatter } = require("../pdfWriter/pdfKitFunctions")


exports.superviseeClientPaymentsTable = (date, data) => {
    sortByName(data)
    let totalQty = data.map(x => x.qty).reduce((a, b) => a + b, 0)
    let totalAppliedPayments = data.map(x => Number(x.total.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    return {
        title: "Supervisee Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Supervisee", property: 'worker', renderer: null, align: "center" },
            { label: "Service Name", property: 'description', renderer: null, align: "center" },
            { label: "Qty", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amt', renderer: null, align: "center" },
            { label: "Total Payments Applied", property: 'total', renderer: null, align: "center" },
        ],
        datas: [...data],
        // rows: [['Total', "-", totalQty, "-", formatter.format(totalAppliedPayments)],]
    }
}
