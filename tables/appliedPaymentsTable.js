const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.appliedPaymentsTable = (date, paymentData) => {
    paymentData.map(x => x.superviser = x.superviser.split(',')[1] + " " + x.superviser.split(',')[0])
    let totalAppliedAmt = paymentData.map(x => Number(x.applied_amt.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    let totalDuration_hrs = paymentData.map(x => Number(x.duration_hrs)).reduce((a, b) => a + b, 0)

    return {
        title: "Applied Payments",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Date", property: 'FULLDATE', renderer: null, align: "center" },
            { label: "Service Name", property: 'description', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'inv_no', renderer: null, align: "center" },
            { label: "Worker", property: 'worker', renderer: null, align: "center" },
            { label: "Superviser", property: 'superviser', renderer: null, align: "center" },
            { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'applied_amt', renderer: null, align: "center" }
        ],
        datas: [...paymentData],
        rows: [
            ['Total', "", "", "", "", totalDuration_hrs, formatter.format(totalAppliedAmt)],
        ]
    }
}