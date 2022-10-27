const { formatter } = require("../pdfWriter/pdfKitFunctions");


exports.reportedItemsTable = (data, date, subtotal) => {
    let reportedItemsCount = data.map(x => x.COUNT).reduce((a, b) => a + b, 0)
    return {
        title: "All reported items",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name', renderer: null , align: "center"},
            { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
            { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
            { label: "Payment Type", property: 'receipt_reason', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', reportedItemsCount, "", "", formatter.format(subtotal.toFixed(2))],
        ]
    };
}