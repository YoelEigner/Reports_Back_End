const { sortByName, formatter } = require("../pdfWriter/pdfKitFunctions");

exports.summarizedTransactionTable = (date, paymentData, site) => {
    const tableTotal = paymentData.reduce((acc, curr) => acc + curr.sum, 0);
    const totalQty = paymentData.reduce((acc, curr) => acc + curr.quantity, 0);
    paymentData.sort((a, b) => {
        if (a.worker < b.worker) {
            return -1;
        }
        if (a.worker > b.worker) {
            return 1;
        }
        if (a.reason_type < b.reason_type) {
            return -1;
        }
        if (a.reason_type > b.reason_type) {
            return 1;
        }
        return 0;
    });
    const row = ['Total', '-', totalQty , '-', formatter.format(tableTotal.toFixed(2))]

    return {
        title: site,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", property: 'worker', renderer: null, align: "center" },
            { label: "Reason Type", property: 'reason_type', renderer: null, align: "center" },
            { label: "Qty", property: 'quantity', renderer: null, align: "center" },
            { label: "Site", property: 'site', renderer: null, align: "center" },
            { label: "Total", property: 'sum', renderer: null, align: "center" },

        ],
        datas: [...paymentData],
        rows: [
            row
        ],

    }
}

