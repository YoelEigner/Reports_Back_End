const { formatter } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate } = require("../sql/sql")
const { getRate_CPRI } = require("./associateFeesTherapy")

const isNum = (num) => {
    if (isNaN(num)) { return 0 }
    else { return num }

}

const getRatesForL1 = (arr) => {
    return arr.map(x => x !== undefined ? Number(x.replace(/[^0-9.-]+/g, "")) : 0).reduce((a, b) => a + b, 0)
}

const getRate = async (count, workerId, getSubPrac, L1AssociateFee) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    // const isSUperviserOne = await isSuperviserOne(worker)

    if (associateFees[0] !== undefined) {
        if (getSubPrac) {
            if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorOneGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRate_f, associateFees[0].associateFeeBaseRateOverrideGreaterThen_f,
                associateFees[0].associateFeeBaseRateOverrideLessThen_f]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_f),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThen_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRateTwo_f, associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f,
                associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRateTwo_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateTwo_f),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f)
                }
            }
            else {
                let amount = [associateFees[0].associateFeeBaseRate_f, associateFees[0].associateFeeBaseRateOverrideGreaterThen_f,
                associateFees[0].associateFeeBaseRateOverrideLessThen_f]
                return {
                    isSuperviser: true,
                    isZero: Number(associateFees[0].associateFeeBaseRate_f) == 0,
                    associateRate: 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_f) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_f),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            if (associateFees[0].supervisorOneGetsMoney) { return Number(associateFees[0].associateFeeBaseRate_f) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f) }
            else if (associateFees[0].supervisorTwoGetsMoney) { return Number(associateFees[0].associateFeeBaseRateTwo_f) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f) }
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_f)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo_f)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_f)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_f) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_f)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_f)
                }
            }
        }
    }
}
exports.associateFeesTherapyCPRI = async (worker, count, date, workerId, superviseeFeeCalculation, removedNonChargablesArr, isl1SupPrac, workerProfile, otherItemsRate, otherItemsQty) => {
    let superviserGetsTherapyMoney =
        (workerProfile[0].supervisorOneGetsMoney === true)
        ||
        (workerProfile[0].supervisorTwoGetsMoney === true)

    let rate = await getRate_CPRI(removedNonChargablesArr, workerId, false)

    let totalWoHST = ((count - otherItemsQty) * rate) + otherItemsRate
    let hst = totalWoHST * (process.env.HST / 100)
    let tableTotal = totalWoHST + hst + superviseeFeeCalculation.map(x => Number(x[4].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    let hstRemoved = 0
    if (isl1SupPrac) { hstRemoved = hst }

    let superviseeOthers = superviseeFeeCalculation.map(x => x.length).includes(11)

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
            (count - otherItemsQty),
            formatter.format(rate),
            formatter.format(hst),
            formatter.format(totalWoHST + hst - hstRemoved)
        ]
        if (otherItemsQty > 0 || superviseeOthers) { headers.splice(3, 0, { label: "SU Qty", renderer: null, align: "center" }, { label: "SU Fees", renderer: null, align: "center" }) }
        if (otherItemsQty > 0 || superviseeOthers) { rows.splice(3, 0, otherItemsQty, formatter.format(otherItemsRate),) }
    }

    return {
        title: "CPRI Associate Fees (Therapy Only)",
        subtitle: "From " + date.start + " To " + date.end,
        headers: headers,
        rows: [
            rows,
            ...superviseeFeeCalculation
        ],
        tableTotal: tableTotal
    }
}
