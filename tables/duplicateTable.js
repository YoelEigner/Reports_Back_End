const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.duplicateTable = (data, date) => {
    return {
        title: "Duplicate & split fees",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name', renderer: null },
            { label: "Event ID", property: 'event_id', renderer: null, align: "center" },
            { label: "Case File Name", property: 'case_file_name', renderer: null , align: "center"},
            { label: "Total", property: 'TOTAL', renderer: null , align: "center"}
        ],
        datas: [...data],
        rows: [
            [""],
            ['Total', data.length, "", formatter.format(data.map(x => x.event_service_item_total).reduce((a, b) => a + b, 0).toFixed(2))]
        ]
    }
}