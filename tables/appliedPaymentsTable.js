const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.appliedPaymentsTable = (date, paymentData) => {
    // paymentData.map(x => x.dateFromParts = new Date(x.dateFromParts).toLocaleDateString().split("-")[1] + "/" +
    //     new Date(x.dateFromParts).toLocaleDateString().split("-")[2] + "/" + new Date(x.dateFromParts).toLocaleDateString().split("-")[0])
    return {
        title: "Applied Payments",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Date", property: 'FULLDATE', renderer: null },
            { label: "Service Name", property: 'description', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'inv_no', renderer: null, align: "center" },
            { label: "Worker", property: 'worker', renderer: null, align: "center" },
            { label: "Superviser", property: 'superviser', renderer: null, align: "center" },
            { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'applied_amt', renderer: null, align: "center" }
        ],
        datas: [...paymentData],
    }
}