const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { getRate_CBT } = require("./associateFeesTherapy")


exports.associateFeesTherapyCBT = async (worker, count, date, workerId, superviseeFeeCalculation, removedNonChargablesArr, isl1SupPrac, workerProfile) => {
    let superviserGetsTherapyMoney =
        (workerProfile[0].supervisorOneGetsMoney === true)
        ||
        (workerProfile[0].supervisorTwoGetsMoney === true)

    let rate = await getRate_CBT(removedNonChargablesArr, workerId, false)

    let totalWoHST = (count * rate)
    let hst = totalWoHST * (process.env.HST / 100)
    let tableTotal = totalWoHST + hst + superviseeFeeCalculation.map(x => Number(x[4].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    let hstRemoved = 0
    if (isl1SupPrac) { hstRemoved = hst }

    let headers = []
    let rows = []
    if (superviserGetsTherapyMoney && workerProfile[0].isSuperviser === false) {
        headers = [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity hrs", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ]
        rows = [
            worker,
            0,
            formatter.format(rate),
            formatter.format(0),
            formatter.format(0)
        ]
    }
    else {
        headers = [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity hrs", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ]
        rows = [
            worker,
            count,
            formatter.format(rate),
            formatter.format(hst),
            formatter.format(totalWoHST + hst - hstRemoved)
        ]
    }
    return {
        title: "CBT Associate Fees (Therapy Only)",
        subtitle: "From " + date.start + " To " + date.end,
        headers: headers,
        rows: [
            rows,
            ...superviseeFeeCalculation
        ],
        tableTotal: tableTotal
    }
}