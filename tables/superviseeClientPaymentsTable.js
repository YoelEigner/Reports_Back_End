const { sortByName, formatter, sortByDateAndName } = require("../pdfWriter/pdfKitFunctions")


exports.superviseeClientPaymentsTable = (date, data) => {
    sortByName(data)
    return {
        title: "Supervisee Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Supervisee", property: 'worker', renderer: null, align: "center" },
            { label: "Cart Item", property: 'description', renderer: null, align: "center" },
            { label: "Qty", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amt', renderer: null, align: "center" },
            { label: "Total Payments Applied", property: 'total', renderer: null, align: "center" },
        ],
        datas: [...data],
    }
}
