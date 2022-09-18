const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.nonRemittablesTable = (date, non_remittableItems) => {
    let totalHours = non_remittableItems.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
    let totalAmount = non_remittableItems.map(x => x.applied_amt).reduce((a, b) => a + b, 0)
    return {
        title: "Non Remittables",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Description", property: 'description', renderer: null },
            { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amt', renderer: null, align: "center" },
            // { label: "Total", property: 'TOTAL', renderer: null, align: "center" }
        ],
        datas: [...non_remittableItems],
        rows: [
            [''],
            ['Total', totalHours, formatter.format(totalAmount)],
            // ['Total', data.map(x => x.COUNT).reduce((a, b) => a + b, 0), "", formatter(data.map(x => x.event_service_item_total).reduce((a, b) => a + b, 0).toFixed(2))],
        ]
    }
}