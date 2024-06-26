const { formatter, sortDataByKeys } = require("../pdfWriter/pdfKitFunctions");

exports.summarizedTransactionTable = (date, paymentData, site) => {
    const tableTotal = paymentData.reduce((acc, curr) => acc + curr.sum, 0);
    const totalQty = paymentData.reduce((acc, curr) => acc + curr.quantity, 0);
    const sortedData = sortDataByKeys(paymentData, ['reason_type'])

    const row = ['Total', totalQty, '-', formatter.format(tableTotal.toFixed(2))]

    return {
        title: site,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Reason Type", property: 'reason_type', renderer: null, align: "center" },
            { label: "Qty", property: 'quantity', renderer: null, align: "center" },
            { label: "Site", property: 'site', renderer: null, align: "center" },
            { label: "Total", property: 'sum', renderer: null, align: "center" },

        ],
        datas: [...sortedData],
        rows: [
            row
        ],

    }
}

