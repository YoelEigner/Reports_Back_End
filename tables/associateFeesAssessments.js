const { formatter } = require("../pdfWriter/pdfKitFunctions")



exports.associateFeesAssessments = async (worker, data, date, rate, tableType, superviseeAssessmentFees, workerProfile, reportType) => {
    let superviserGetsAssessmentMoney =
        (workerProfile[0].assessmentMoneyToSupervisorOne === true)
        ||
        (workerProfile[0].assessmentMoneyToSupervisorTwo === true)

    if (superviserGetsAssessmentMoney && workerProfile[0].isSuperviser === false) {
        data = []
        let tableTotal = superviseeAssessmentFees.map(x => Number(x[4].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
        return {
            title: `${tableType} Associate Fees (Assessments Only)`,
            subtitle: "From " + date.start + " To " + date.end,
            headers: [
                { label: "Worker", renderer: null, align: "center" },
                { label: "Invoice Quantity", renderer: null, align: "center" },
                { label: "Quantity hrs", renderer: null, align: "center" },
                { label: "Total Assessment", renderer: null, align: "center" },
                { label: "Fee Base Rate", renderer: null, align: "center" },
                { label: "HST", renderer: null, align: "center" },
                { label: "Total + HST", renderer: null, align: "center" }
            ],
            rows: [
                [
                    worker,
                    0,
                    formatter.format(0),
                    formatter.format(0),
                    `${rate}%`,
                    formatter.format(0),
                    formatter.format(0)
                ],
            ],
            ...superviseeAssessmentFees,
            tableTotal: tableTotal
        }
    }

    else {
        let filteredData = data.filter(x => x.event_primary_worker_name ? x.event_primary_worker_name.includes(worker) : x.worker.includes(worker))
        let count = filteredData.length
        let invoice_fee_qty = filteredData.map(x => x.invoice_fee_qty)?.reduce((a, b) => a + b, 0)
        let fee = filteredData.map(x => x.assessmentAssociateFee = x.applied_amt ? (x.applied_amt / 100) * rate : (Number(x.TOTAL.replace(/[^0-9.-]+/g, "")) / 100) * rate).reduce((a, b) => a + b, 0)

        let totalOfAllItems = filteredData.map(x => x.totalOfAllItems = x.applied_amt ? x.applied_amt : Number(x.TOTAL.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
        let hst = fee * (process.env.HST / 100)

        let tableTotal = fee + hst + superviseeAssessmentFees.map(x => Number(x[4].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)

        return {
            title: `${tableType} Associate Fees (Assessments Only)`,
            subtitle: "From " + date.start + " To " + date.end,
            headers: [
                { label: "Worker", renderer: null, align: "center" },
                { label: "Invoice Quantity", renderer: null, align: "center" },
                { label: "Quantity hrs", renderer: null, align: "center" },
                { label: "Total Assessment", renderer: null, align: "center" },
                { label: "Fee Base Rate", renderer: null, align: "center" },
                { label: "HST", renderer: null, align: "center" },
                { label: "Total + HST", renderer: null, align: "center" }
            ],
            rows: [
                [
                    worker,
                    count,
                    invoice_fee_qty,
                    formatter.format(totalOfAllItems),
                    `${rate}%`,
                    formatter.format(hst),
                    formatter.format(fee + hst)
                ],
                ...superviseeAssessmentFees
            ],
            tableTotal: tableTotal
        }
    }


}