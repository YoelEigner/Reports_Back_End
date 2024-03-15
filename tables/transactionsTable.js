const { formatter, sortDataByKeys } = require("../pdfWriter/pdfKitFunctions");

exports.transactionsTable = (date, paymentData, proccessingFee, proccessingFeeQty) => {
    const sortedData = sortDataByKeys(paymentData, ['worker', 'reason_type'])

    const row = ['Total fees', '-', proccessingFeeQty, '-', formatter.format(proccessingFee)]

    return {
        title: "Transactions",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", property: 'worker', renderer: null, align: "center" },
            { label: "Reason Type", property: 'reason_type', renderer: null, align: "center" },
            { label: "Qty", property: 'quantity', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'cost', renderer: null, align: "center" },
            { label: "total", property: 'sum', renderer: null, align: "center" },

        ],
        datas: [...sortedData],
        rows: [
            row
        ],

    }
}

