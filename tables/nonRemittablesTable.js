const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.nonRemittablesTable = (date, non_remittableItems) => {
    let totalHours = non_remittableItems.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
    let totalAmount = non_remittableItems.map(x => x.applied_amt).reduce((a, b) => a + b, 0)

    let totalL1SupPracAmount = non_remittableItems.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    return {
        title: "Non Remittables",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Description", property: 'description', renderer: null, align: "center" },
            { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amt', renderer: null, align: "center" },
        ],
        datas: [...non_remittableItems],
        rows: [
            ['Total', totalHours, formatter.format(totalAmount)],
        ],
        totalL1SupPracAmount: totalL1SupPracAmount
    }
}