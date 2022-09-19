const { formatter } = require("../pdfWriter/pdfKitFunctions");


exports.reportedItemsTable = (data, date, subtotal, non_chargeables) => {
    // let non_chargeablesArr = non_chargeables.map(x => x.name)
    let reportedItemsCount = data.map(x => x.COUNT).reduce((a, b) => a + b, 0)
    // let reportedItemsCount = data.map(x => !non_chargeablesArr.find(n => n === x.event_service_item_name) && x.COUNT).reduce((a, b) => a + b, 0)
    return {
        title: "All reported items",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name', renderer: null , align: "center"},
            { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
            { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
            { label: "Paymment Type", property: 'receipt_reason', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', reportedItemsCount, "", "", formatter.format(subtotal.toFixed(2))],
        ]
    };
}