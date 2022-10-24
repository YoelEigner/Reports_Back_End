const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.adjustmentFeeTable = (date, data) => {
    data.map(x => { x.amt = x.value, x.value = formatter.format(x.value) })
    return {
        title: "Adjustment Fees",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Ajustment Name", property: 'name', renderer: null , align: "center"},
            { label: "Value", property: 'value', renderer: null, align: "center" }
        ],
        datas: [...data],
        rows: [
            ['Total', formatter.format(data.map(f => Number(f.amt)).reduce((a, b) => a + b, 0))]
        ]
    }
}