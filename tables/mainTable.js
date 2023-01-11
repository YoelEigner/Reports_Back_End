const moment = require('moment')

exports.mainTable = (data, date) => {

    data.map(x => {
        x.FULLDATE = moment(x.FULLDATE).format('YYYY-MM-DD')
    })
    return {
        title: "Invoice",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Date", property: 'FULLDATE', renderer: null, align: "center" },
            { label: "Funder Name", property: 'funder_name', renderer: null, align: "center" },
            { label: "Individual Name", property: 'individual_name', renderer: null , align: "center"},
            { label: "Invoice ID", property: 'invoice_id', renderer: null, align: "center" },
            { label: "Service Name", property: 'service_name', renderer: null, align: "center" },
            { label: "Cart Item", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Invoice Fee Qty", property: 'invoice_fee_qty', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" }
        ],
        datas: [...data],
    }
};