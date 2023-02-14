const { sortByName } = require("../pdfWriter/pdfKitFunctions");

exports.transactionsTable = (date, paymentData) => {
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
        datas: [...paymentData],
    }
}

