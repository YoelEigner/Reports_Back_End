const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.footerTable = (subtotal) => {
    return {
        title: "Final Balance",
        subtitle: "Subtitle",
        headers: ["Subtotal", "Paid To Date", "Balance Due"],
        rows: [
            [formatter.format(subtotal), /* paid to date */20, /* balance due*/ 300]
        ],
    }
}