const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { getSubPrac } = require("../sql/sql")

exports.subPracTable = async (date, worker) => {
    let data = await getSubPrac(date, worker)
    return {
        title: "L1 Supervised Practice",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
            { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" },
        ],
        datas: [...data],
        // rows: [
        //     [formatter.format(subtotal), /* paid to date */20, /* balance due*/ 300]
        // ],
    }
}