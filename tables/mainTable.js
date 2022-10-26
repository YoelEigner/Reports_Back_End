
exports.mainTable = (data, date) => {

    return {
        title: "Invoice",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Date", property: 'FULLDATE', renderer: null, align: "center" },
            { label: "Name", property: 'individual_name', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'invoice_id', renderer: null, align: "center" },
            { label: "Service Name", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Balance", property: 'Balance', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" }
        ],
        datas: [...data],
    }
};