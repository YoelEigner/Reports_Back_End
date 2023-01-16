const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.duplicateTable = (data, date) => {
    const total = data.map(x => x.event_service_item_total).reduce((a, b) => a + b, 0).toFixed(2)
    return {
        title: "Duplicate & split fees",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Batch Date", property: 'batch_date', renderer: null, align: "center" },
            { label: "Individual Name", property: 'individual_name', renderer: null, align: "center" },
            { label: "Cart Item", property: 'service_name', renderer: null, align: "center" },
            { label: "Event ID", property: 'event_id', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'invoice_id', renderer: null, align: "center" },
            { label: "Case File Name", property: 'case_file_name', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" }
        ],
        datas: [...data],
        rows: [
            // ['Total', data.length, "-", "-", "-", "-", formatter.format(total)]
        ]
    }
}