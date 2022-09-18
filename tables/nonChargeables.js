const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.nonChargeables = (data, date) => {
    return {
        title: "Non Chargeables",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name',  renderer: null },
            { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
            { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" }
        ],
        datas: [...data],
        rows: [
            [''],
            ['Total', data.map(x => x.COUNT).reduce((a, b) => a + b, 0), "", formatter.format(data.map(x => x.event_service_item_total).reduce((a, b) => a + b, 0).toFixed(2))],
        ]
    }
}