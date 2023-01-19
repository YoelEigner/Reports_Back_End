const { getSupervisers, getReportedItems, getAssociateFeeBaseRate, getAssociateVideoFee } = require("../sql/sql")
const { calculateAssociateFeeForSupervisee } = require("./calculateAssociateFeeForSupervisee.js")

exports.getSupervisiesFunc = async (date, non_chargeablesArr, respSuperviser, profileDates) => {
    try {
        let tempSupervisies = []
        let total = []
        respSuperviser.forEach(async (x) => {
            let resp = await getReportedItems(date, x.associateName, profileDates)
            let subtotal = resp.map(x => !non_chargeablesArr.find(n => n === x.service_name) && x.event_service_item_total).reduce((a, b) => a + b, 0)
            total.push(subtotal)
            tempSupervisies.total = total
            tempSupervisies.push(this.supervisiesTable(resp, date, x.associateName, subtotal.toFixed(2), non_chargeablesArr))
        })
        return tempSupervisies
    } catch (error) {
        console.log(error)
    }
}

exports.supervisiesTable = (data, date, supervisee, subtotal, non_chargeablesArr) => {
    let reportedItemsCount = data.map(x => !non_chargeablesArr.find(n => n === x.service_name) && x.COUNT).reduce((a, b) => a + b, 0)

    return {
        title: "Supervisee - " + supervisee,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Supervisee", property: 'event_primary_worker_name', renderer: null, align: "center" },
            { label: "Cart Item", property: 'service_name', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'invoice_id', renderer: null, align: "center" },
            { label: "Reported Items", property: 'COUNT', renderer: null, align: "center" },
            { label: "Item Total", property: 'itemTotal', renderer: null, align: "center" },
            { label: "Total", property: 'TOTAL', renderer: null, align: "center" },
        ],
        datas: [...data],
        rows: [
            ['Total', "-","-", reportedItemsCount, "-", + subtotal],
        ],
    };
}

