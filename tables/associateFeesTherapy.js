const { formatter, isSuperviserOne, removeNaN } = require("../pdfWriter/pdfKitFunctions")
const { getAssociateFeeBaseRate, getProcessingFee, getPaymentTypes } = require("../sql/sql")

const isNum = (num) => {
    if (isNaN(num)) { return 0 }
    else { return num }

}

const getRatesForL1 = (arr) => {
    return arr.map(x => x !== undefined ? Number(x.replace(/[^0-9.-]+/g, "")) : 0).reduce((a, b) => a + b, 0)
}

exports.associateFeesTherapy = async (worker, count, date, workerId, videoFee, finalProccessingFee, blockItemFees, ajustmentFees, superviseeFeeCalculation, chargeVideoFee, L1AssociateFee) => {
    // let blocksBiWeeklyCharge = Number(blockItemFees.datas.map(x => x.newBiWeeklyRate)[0])
    let rate = await this.getRate(count, workerId, false, L1AssociateFee)
    let vidFee = chargeVideoFee ? Number(videoFee) : 0

    return {
        title: "CFIR Associate Fees (Therapy Only)",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Worker", renderer: null, align: "center" },
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Fee Base Rate", renderer: null, align: "center" },
            { label: "Video Fee", renderer: null, align: "center" },
            { label: "Other Fee", renderer: null, align: "center" },
            { label: "Adjustment Fee", renderer: null, align: "center" },
            { label: "Blocks Charge Fee", renderer: null, align: "center" },
            { label: "HST", renderer: null, align: "center" },
            { label: "Total + HST", renderer: null, align: "center" }
        ],
        rows: [
            [
                worker,
                count,
                formatter.format(rate),
                formatter.format(vidFee),
                formatter.format(finalProccessingFee.toFixed(2)),
                formatter.format(ajustmentFees.toFixed(2)),
                formatter.format(blockItemFees),
                formatter.format(((count * rate) * process.env.HST - (count * rate)).toFixed(2)),
                formatter.format((count * rate) * process.env.HST + vidFee + finalProccessingFee + blockItemFees + ajustmentFees)
            ],
            ...superviseeFeeCalculation
        ],
    }
}

exports.getRate = async (count, workerId, getSubPrac, L1AssociateFee) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    // const isSUperviserOne = await isSuperviserOne(worker)

    if (associateFees[0] !== undefined) {
        if (getSubPrac) {
            if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorOneGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRate, associateFees[0].associateFeeBaseRateOverrideGreaterThen,
                associateFees[0].associateFeeBaseRateOverrideLessThen]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThen) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThen) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThen),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRateTwo, associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo,
                associateFees[0].associateFeeBaseRateOverrideLessThenTwo]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRateTwo) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateTwo),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo)
                }
            }
            else {
                let amount = [associateFees[0].associateFeeBaseRate, associateFees[0].associateFeeBaseRateOverrideGreaterThen,
                associateFees[0].associateFeeBaseRateOverrideLessThen]
                return {
                    isSuperviser: true,
                    isZero: Number(associateFees[0].associateFeeBaseRate) == 0,
                    associateRate: 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            if (associateFees[0].supervisorOneGetsMoney) { return Number(associateFees[0].associateFeeBaseRate) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen) }
            else if (associateFees[0].supervisorTwoGetsMoney) { return Number(associateFees[0].associateFeeBaseRateTwo) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo) }
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate)
                }
            }
        }
    }
}

//*************************************CBT Associate Rates*********************************** */
exports.getRate_CBT = async (count, workerId, getSubPrac, L1AssociateFee) => {
    const associateFees = await getAssociateFeeBaseRate(workerId)
    if (associateFees[0] !== undefined) {
        if (getSubPrac) {
            if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorOneGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRate_c, associateFees[0].associateFeeBaseRateOverrideGreaterThen_c,
                associateFees[0].associateFeeBaseRateOverrideLessThen_c]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_c),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThen_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
            }
            else if (associateFees[0].associateType === 'L1 (Sup Prac)' && associateFees[0].supervisorTwoGetsMoney) {
                let amount = [associateFees[0].associateFeeBaseRateTwo_c, associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c,
                associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c]
                return {
                    isSuperviser: false,
                    isZero: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) == 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRateTwo_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateTwo_c),
                    associateRate: Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c)
                }
            }
            else {
                let amount = [associateFees[0].associateFeeBaseRate_c, associateFees[0].associateFeeBaseRateOverrideGreaterThen_c,
                associateFees[0].associateFeeBaseRateOverrideLessThen_c]
                return {
                    isSuperviser: true,
                    isZero: Number(associateFees[0].associateFeeBaseRate_c) == 0,
                    associateRate: 0,
                    superviserRate: Number(associateFees[0].associateFeeBaseRate_c) == 0 ?
                        getRatesForL1(amount) : Number(associateFees[0].associateFeeBaseRate_c),
                    cfirRate: Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
            }
        }
        if (associateFees[0].associateType === 'L1 (Sup Prac)') {
            if (associateFees[0].supervisorOneGetsMoney) { return Number(associateFees[0].associateFeeBaseRate_c) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c) }
            else if (associateFees[0].supervisorTwoGetsMoney) { return Number(associateFees[0].associateFeeBaseRateTwo_c) + Number(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c) }
        }
        else {
            if (associateFees[0].supervisorOneGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_c)
                }
            }
            else if (associateFees[0].supervisorTwoGetsMoney) {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThenTwo_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThenTwo_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRateTwo_c)
                }
            }
            else {
                if (count >= 34) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideGreaterThen_c)
                }
                else if (parseFloat(associateFees[0].associateFeeBaseRateOverrideLessThen_c) !== 0 && count <= 33) {
                    return isNum(associateFees[0].associateFeeBaseRateOverrideLessThen_c)
                }
                else {
                    return isNum(associateFees[0].associateFeeBaseRate_c)
                }
            }
        }
    }
}

//*************************************CPRI Associate Rates *****************************************/
exports.getRate_CPRI = async (count, workerId, getSubPrac, L1AssociateFee) => {
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