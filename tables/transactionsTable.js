const { sortByName } = require("../pdfWriter/pdfKitFunctions");

exports.transactionsTable = (date, paymentData) => {
    // let data = sortByName(paymentData.map(x => x[0]))
    // let data = paymentData.map(x => x[0])
    // data.sort((a, b) => {
    //     var textA = a.superviser.toUpperCase();
    //     var textB = b.superviser.toUpperCase();
    //     return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    // });
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
            // { label: "Record ID", property: 'rec_id', renderer: null, align: "center" },
            { label: "Reason Type", property: 'reason_type', renderer: null, align: "center" },
            { label: "Qty", property: 'quantity', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'cost', renderer: null, align: "center" },
            { label: "total", property: 'sum', renderer: null, align: "center" },

        ],
        datas: [...paymentData],
    }
}

