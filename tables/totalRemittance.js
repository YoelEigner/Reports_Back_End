const { formatter } = require("../pdfWriter/pdfKitFunctions")


const calculateTotalGoHomePay = (workerProfile, netAppliedPayments, fees) => {
    let associate_type = workerProfile[0].associateType
    let isSpervised = workerProfile[0].isSupervised
    let isSuperviser = workerProfile[0].isSuperviser
    let isSupervisedByNonDirector = workerProfile[0].IsSupervisedByNonDirector
    let superviserGetMoney = workerProfile[0].supervisorOneGetsMoney || workerProfile[0].supervisorTwoGetsMoney
    let isSupervisedAndSupervisor = workerProfile[0].isSuperviser && workerProfile[0].isSupervised

    if(isSupervisedAndSupervisor){
        return netAppliedPayments - fees
    }
    else if ((associate_type === 'L1' || associate_type === 'L2') && !isSpervised && !isSuperviser) {
        // if(superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    else if ((associate_type === 'L3' || associate_type === 'L4') && !isSupervisedByNonDirector) {
        return 0
    }
    else if ((associate_type === 'L3' || associate_type === 'L4') && isSupervisedByNonDirector) {
        if (superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    if ((associate_type === 'L1' || associate_type === 'L2') && isSupervisedByNonDirector) {
        // if(superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    else if (associate_type !== 'L1 (Sup Prac)' && isSupervisedByNonDirector) {
        // if(superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    else if (associate_type === 'L1 (Sup Prac)' && !isSupervisedByNonDirector) {
        // if(superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    else if (associate_type === 'L1 (Sup Prac)') {
        // if(superviserGetMoney) return 0
        return netAppliedPayments - fees
    }
    else {
        return netAppliedPayments - fees
    }
}

exports.totalRemittance = (date, associateTotal, netAppliedPayments, finalAssociateAssessmentFees, workerProfile) => {
    let newTotal = 0
    // console.log(associateTotal, finalAssociateAssessmentFees, associateTotal + finalAssociateAssessmentFees)
    let fees = Number(associateTotal) + Number(finalAssociateAssessmentFees)
    let feeHeaders = "CFIR invoice total\n (Subtotal + Associateship Fees)"

    newTotal = calculateTotalGoHomePay(workerProfile, netAppliedPayments, fees)

    return {
        title: "Total Remittance",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "NET APPLIED PAYMENTS \n(from Payment Report)", renderer: null, align: "center" },
            { label: feeHeaders, renderer: null, align: "center" },
            { label: "New Total", renderer: null, align: "center" },
        ],
        rows: [[formatter.format(netAppliedPayments), formatter.format(fees), formatter.format(newTotal)]],
    }
}