const { formatter } = require("../pdfWriter/pdfKitFunctions");
const { getRate } = require("./associateFees");


exports.reportedItemsTable = async (data, date, subtotal, workerId) => {
    let reportedItemsCount = data.map(x => x.qty).reduce((a, b) => a + b, 0)
    data.map(x => {
        x.totalAmt = x.event_service_item_total * x.qty
    })
    // let reportedItemsCount = data.map(x => x.COUNT).reduce((a, b) => a + b, 0)
    // let rate = await getRate(32, workerId, true)
    // let subPracTotal = 0
    // if (rate !== undefined) {
    //     let associateRate = Number(rate.superviser) + Number(rate.CFIR)
    //     //****************calculate L1 Sup Practice amount***************/
    //     rate.one ?
    //         data.map(x => x.subPracAmount = formatter.format((x.itemTotal.replace(/[^0-9.-]+/g, "") - associateRate) * x.COUNT))
    //         : data.map(x => x.subPracAmount = formatter.format(Number(rate.worker) * x.COUNT))
    //     subPracTotal = data.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    // }
    // let headers = [
    //     { label: "Service Name", property: 'event_service_item_name', renderer: null, align: "center" },
    //     { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
    //     { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
    //     { label: "Total", property: 'TOTAL', renderer: null, align: "center" },
    // ]
    // let rows = ['Total', reportedItemsCount, "-", formatter.format(subtotal.toFixed(2))]
    // if (subPracTotal !== 0) {
    //     headers.push({ label: "Sup Prac Total", property: 'subPracAmount', renderer: null, align: "center" })
    //     rows.push(formatter.format(subPracTotal))
    // }

    return {
        title: "All reported items",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Service Name", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Reported Items", property: 'qty', renderer: null, align: "center" },
            { label: "Item Total", property: 'event_service_item_total', renderer: null, align: "center" },
            { label: "Total", property: 'totalAmt', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', reportedItemsCount, "-", formatter.format(subtotal.toFixed(2))]
        ]
    };
}