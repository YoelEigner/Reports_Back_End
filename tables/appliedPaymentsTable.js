const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { getRate } = require("./associateFees")

exports.appliedPaymentsTable = async (date, paymentData, workerId) => {
    paymentData.map(x => x.superviser = x.superviser.split(',')[1] + " " + x.superviser.split(',')[0])
    let totalAppliedAmt = paymentData.map(x => Number(x.applied_amt)).reduce((a, b) => a + b, 0)
    let totalDuration_hrs = paymentData.map(x => Number(x.duration_hrs)).reduce((a, b) => a + b, 0)

    //****************calculate L1 Sup Practice amount***************/
    let rate = await getRate(32, workerId, true)
    let subPracTotal = 0
    if (rate !== undefined && rate.isZero) {
        let associateRate = rate.associateRate
        paymentData.map(x => x.subPracAmount = formatter.format(Number(x.applied_amt) - associateRate)).reduce((a, b) => a + b, 0)
        subPracTotal = paymentData.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }
    else if (rate !== undefined && !rate.isZero) {
        paymentData.map(x => x.subPracAmount = formatter.format(Number(rate.associateRate))).reduce((a, b) => a + b, 0)
        subPracTotal = paymentData.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }

    let headers = [
        { label: "Date", property: 'FULLDATE', renderer: null, align: "center" },
        { label: "Service Name", property: 'description', renderer: null, align: "center" },
        { label: "Invoice ID", property: 'inv_no', renderer: null, align: "center" },
        { label: "Worker", property: 'worker', renderer: null, align: "center" },
        { label: "Superviser", property: 'superviser', renderer: null, align: "center" },
        { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
        { label: "Applied Amount", property: 'applied_amt', renderer: null, align: "center" },
    ]

    let rows = ['Total', "-", "-", "-", "-", totalDuration_hrs, formatter.format(totalAppliedAmt)]

    if (subPracTotal !== 0) {
        headers.push({ label: "Sup Prac Total", property: 'subPracAmount', renderer: null, align: "center" })
        rows.push(formatter.format(subPracTotal))
    }

    return {
        title: "Applied Payments",
        subtitle: "From " + date.start + " To " + date.end,
        headers: headers,
        datas: [...paymentData],
        rows: [
            rows,
        ]
    }
}