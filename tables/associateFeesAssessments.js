const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.associateFeesAssessments = async (worker, data, date, rate, tableType) => {
    let count = data.length
    let fee = data.map(x => x.assessmentAssociateFee = x.applied_amt ? (x.applied_amt / 100) * rate : (Number(x.TOTAL.replace(/[^0-9.-]+/g, "")) / 100) * rate).reduce((a, b) => a + b, 0)
    // let HST = (fee / 100) * process.env.HST
    let hst = fee * (process.env.HST / 100)

    return {
        title: `${tableType} Associate Fees (Assessments Only)`,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                `${rate}%`,
                formatter.format(hst),
                formatter.format(fee + hst)
            ],
        ],
    }
}