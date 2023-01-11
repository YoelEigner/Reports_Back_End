const { formatter } = require("../pdfWriter/pdfKitFunctions")
// const { getSubPrac } = require("../sql/sql")

exports.subPracTable = async (date, worker, profileDates) => {
    // let data = await getSubPrac(date, worker, profileDates)
    return {
        title: "L1 Supervised Practice",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Cart Item", property: 'service_name', renderer: null, align: "center" },
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