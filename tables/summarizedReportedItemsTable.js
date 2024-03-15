const { formatter, sortDataByKeys } = require("../pdfWriter/pdfKitFunctions");
const { getRate } = require("./associateFeesTherapy");


exports.summarizedReportedItemsTable = async (data, date, site) => {
    let reportedItemsCount = data.map(x => x.qty).reduce((a, b) => a + b, 0)

    data.map(x => {
        if (x.event_service_item_qty === 1) { x.tempItemTotal = x.event_service_item_total }
        else { x.tempItemTotal = x.event_service_item_total / x.event_service_item_qty }
        x.totalAmt = x.tempItemTotal * (x.invoice_fee_qty + x.qty - 1)
    })

    const sortedData = sortDataByKeys(data, ['event_primary_worker_name', 'event_service_item_name'])

    let subtotal = sortedData.map(x => x.totalAmt).reduce((a, b) => a + b, 0)

    const row = ['Total', "-", reportedItemsCount, '-', formatter.format(subtotal.toFixed(2))]

    return {
        title: site,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", property: 'event_primary_worker_name', renderer: null, align: "center" },
            { label: "Cart Item", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Reported Items", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'tempItemTotal', renderer: null, align: "center" },
            { label: "Total", property: 'totalAmt', renderer: null, align: "center" },
        ],
        datas: [...sortedData],
        rows: [
            row
        ]
    };
}