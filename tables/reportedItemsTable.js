const { formatter } = require("../pdfWriter/pdfKitFunctions");
const { getRate } = require("./associateFeesTherapy");


exports.reportedItemsTable = async (data, date) => {
    let reportedItemsCount = data.map(x => x.qty).reduce((a, b) => a + b, 0)

    data.map(x => {
        if (x.event_service_item_qty === 1) { x.tempItemTotal = x.event_service_item_total }
        else { x.tempItemTotal = x.event_service_item_total / x.event_service_item_qty }
        x.totalAmt = x.tempItemTotal * (x.invoice_fee_qty + x.qty - 1)
    })

    let subtotal = data.map(x => x.totalAmt).reduce((a, b) => a + b, 0)

    return {
        title: "All reported items",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Cart Item", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Reported Items", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'tempItemTotal', renderer: null, align: "center" },
            { label: "Total", property: 'totalAmt', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', reportedItemsCount, "-", formatter.format(subtotal.toFixed(2))]
        ]
    };
}