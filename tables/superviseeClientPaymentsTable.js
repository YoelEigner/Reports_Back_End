
exports.superviseeClientPaymentsTable = (date, data) => {
    return {
        title: "Supervisee Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Superviser", property: 'superviser', renderer: null , align: "center"},
            { label: "Service Name", property: 'description', renderer: null, align: "center" },
            { label: "Qty", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'applied_amt', renderer: null, align: "center" },
            { label: "Total", property: 'total', renderer: null, align: "center" },
        ],
        datas: [...data]
    }
}
