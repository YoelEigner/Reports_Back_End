exports.transactionsTable = (date, paymentData) => {
    let data = paymentData.map(x => x[0])
    data.sort((a, b) => {
        var textA = a.superviser.toUpperCase();
        var textB = b.superviser.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
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
        datas: [...data],
    }
}