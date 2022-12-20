const { sortByName, formatter } = require("../pdfWriter/pdfKitFunctions")


exports.superviseeClientPaymentsTable = (date, data) => {
    sortByName(data)
    // console.log(data)
    // let totalQty = data.map(x => x.qty).reduce((a, b) => a + b, 0)
    // let totalAppliedPayments = data.map(x => Number(x.total.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    return {
        title: "Supervisee Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Supervisee", property: 'worker', renderer: null, align: "center" },
            { label: "Cart Item", property: 'description', renderer: null, align: "center" },
            { label: "Qty", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amtTemp', renderer: null, align: "center" },
            { label: "Total Payments Applied", property: 'totalTemp', renderer: null, align: "center" },
        ],
        datas: [...data],
    }
}
