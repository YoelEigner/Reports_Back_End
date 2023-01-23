const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { superviserGetsAssessmentMoney } = require("../sql/sql")
const { getRate } = require("./associateFeesTherapy")

exports.L1SupPracTable = async (date, paymentData, workerId, name, superviser) => {
    let filterWorkers = paymentData.filter(x => x.worker === name)
    let totalAppliedAmt = filterWorkers.map(x => Number(x.applied_amt)).reduce((a, b) => a + b, 0)
    let totalDuration_hrs = filterWorkers.map(x => Number(x.duration_hrs)).reduce((a, b) => a + b, 0)

    //****************calculate L1 Sup Practice amount***************/
    let rate = await getRate(paymentData.length, workerId, true)
    let superViserArr = await superviserGetsAssessmentMoney(workerId)
    let superviserGetsAssessmentMoneyVar = superViserArr.map(x =>
        (x.supervisor1 === superviser) && x.assessmentMoneyToSupervisorOne === true || (x.supervisor2 === superviser) && x.assessmentMoneyToSupervisorTwo === true)
    let subPracTotal = 0
    // let superviserRate = rate.superviserRate * filterWorkers.length
    let superviserRate = superviserGetsAssessmentMoneyVar[0] ? rate.superviserRate * filterWorkers.length : 0
    let superviserHours = superviserGetsAssessmentMoneyVar[0] ? filterWorkers.map(x => x.duration_hrs).reduce((a, b) => a + b, 0) : 0

    filterWorkers.map(x => { return (x.superviorTotal = superviserRate, x.supervisorTotalHours = superviserHours) })
    if (rate !== undefined && rate.isZero) {
        filterWorkers.map(x => x.subPracAmount = formatter.format(Number(x.applied_amt) - rate.associateRate)).reduce((a, b) => a + b, 0)
        subPracTotal = filterWorkers.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }
    else if (rate !== undefined && !rate.isZero) {
        filterWorkers.map(x => x.subPracAmount = formatter.format(Number(rate.associateRate))).reduce((a, b) => a + b, 0)
        subPracTotal = filterWorkers.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }
    return {
        // test: console.log(subPracTotal, name),
        title: "Supervisees (L1 Supervised Practice) " + name,
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Date", property: 'batch_date', renderer: null, align: "center" },
            { label: "Cart Item", property: 'description', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'inv_no', renderer: null, align: "center" },
            { label: "Worker", property: 'worker', renderer: null, align: "center" },
            { label: "Superviser", property: 'superviser', renderer: null, align: "center" },
            { label: "Duration Hours", property: 'duration_hrs', renderer: null, align: "center" },
            { label: "Applied Amount", property: 'applied_amt', renderer: null, align: "center" },
            { label: "Go Home Total", property: 'subPracAmount', renderer: null, align: "center" }
        ],
        datas: [...filterWorkers],
        rows: [
            ['Total', "-", "-", "-", "-", totalDuration_hrs, formatter.format(totalAppliedAmt), formatter.format(subPracTotal)],
        ],
        amountForSuperviser: superviserRate,
        hoursForSuperviser: superviserHours,
    }
}