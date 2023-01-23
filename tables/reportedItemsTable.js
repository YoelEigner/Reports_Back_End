const { formatter } = require("../pdfWriter/pdfKitFunctions");
const { getRate } = require("./associateFeesTherapy");


exports.reportedItemsTable = async (data, date, subtotal, workerId, invoiceData) => {
    let reportedItemsCount = data.map(x => x.qty).reduce((a, b) => a + b, 0)
    data.map(x => {
        x.totalAmt = x.event_service_item_total * x.qty
    })

    return {
        title: "All reported items",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Cart Item", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Reported Items", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'event_service_item_total', renderer: null, align: "center" },
            { label: "Total", property: 'totalAmt', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', reportedItemsCount, "-", formatter.format(subtotal.toFixed(2))]
        ]
    };
}