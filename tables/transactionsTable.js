const { getNotUnique, uniqueValues } = require("../pdfWriter/pdfKitFunctions")

exports.transactionsTable = (date, paymentData) => {
    return {
        title: "Transactions",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Superviser", property: 'superviser', renderer: null, align: "center" },
            { label: "Record ID", property: 'rec_id', renderer: null, align: "center" },
            { label: "Reason Type", property: 'reason_type', renderer: null, align: "center" },
            { label: "Qty", property: 'quantity', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'applied_amt', renderer: null, align: "center" },
            { label: "total", property: 'total_amt', renderer: null, align: "center" },

        ],
        datas: [...paymentData.map(x => x[0])],
    }
}