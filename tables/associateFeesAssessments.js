const { formatter } = require("../pdfWriter/pdfKitFunctions")



exports.associateFeesAssessments = async (worker, data, date, rate, tableType, superviseeAssessmentFees) => {

    let filteredData = data.filter(x => x.event_primary_worker_name ? x.event_primary_worker_name === worker : x.worker === worker)
    let count = filteredData.length
    let fee = filteredData.map(x => x.assessmentAssociateFee = x.applied_amt ? (x.applied_amt / 100) * rate : (Number(x.TOTAL.replace(/[^0-9.-]+/g, "")) / 100) * rate).reduce((a, b) => a + b, 0)

    let totalOfAllItems = filteredData.map(x => x.totalOfAllItems = x.applied_amt ? x.applied_amt : Number(x.TOTAL.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    let hst = fee * (process.env.HST / 100)
    
    return {
        title: `${tableType} Associate Fees (Assessments Only)`,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Total Assessment", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                formatter.format(totalOfAllItems),
                `${rate}%`,
                formatter.format(hst),
                formatter.format(fee + hst)
            ],
            ...superviseeAssessmentFees
        ],
    }
}