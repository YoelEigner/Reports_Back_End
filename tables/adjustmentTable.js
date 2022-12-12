const { formatter } = require("../pdfWriter/pdfKitFunctions")



exports.adjustmentFeeTable = (date, data) => {
    const filteredArray = data.filter(object => Number(object.value) !== 0)
    const parsedArray = filteredArray.map(item => {
        const parsed = JSON.parse(item.adjustmentPaymentFee);
        parsed[0].associateName = item.associateName;
        return parsed;
    });

    parsedArray.flat().map(x => {
        x.amt = x.value
        x.value = formatter.format(x.value)
        x.name = x.name === '' ? '-' : x.name
    })

    return {
        title: "Adjustment Fees",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Associate Name", property: 'associateName', renderer: null, align: "center" },
            { label: "Ajustment Name", property: 'name', renderer: null, align: "center" },
            { label: "Value", property: 'value', renderer: null, align: "center" }
        ],
        datas: [...parsedArray.flat()],
        rows: [
            ['Total', '-', formatter.format(parsedArray.flat().map(f => Number(f.amt)).reduce((a, b) => a + b, 0))]
        ]
    }
}