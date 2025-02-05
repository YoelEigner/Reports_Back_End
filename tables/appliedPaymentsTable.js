const { formatter, sortByDateAndName } = require("../pdfWriter/pdfKitFunctions")
const { getRate } = require("./associateFeesTherapy")
const moment = require('moment')

exports.appliedPaymentsTable = async (date, paymentData, workerId) => {

    paymentData.map(x => {
        x.superviser = x.superviser.split(',')[1] + " " + x.superviser.split(',')[0]
        x.batch_date = moment.utc(x.FULLDATE).format('YYYY-MM-DD')
    })
    let totalAppliedAmt = paymentData.map(x => Number(x.applied_amt)).reduce((a, b) => a + b, 0)
    let totalDuration_hrs = paymentData.map(x => Number(x.duration_hrs)).reduce((a, b) => a + b, 0)

    //****************calculate L1 Sup Practice amount***************/
    let rate = await getRate(paymentData.length, workerId, true)

    let subPracTotal = 0
    let associateFee = rate.superviserRate + rate.cfirRate

    if (rate !== undefined && rate.isZero) {
        let associateRate = rate.associateRate
        paymentData.map(x => x.subPracAmount = Number(x.applied_amt) - associateRate <= 0 ? formatter.format(0) : formatter.format(Number(x.applied_amt) - associateRate)).reduce((a, b) => a + b, 0)
        subPracTotal = paymentData.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }
    else if (rate !== undefined && !rate.isZero) {
        paymentData.map(x => x.subPracAmount = Number(rate.associateRate) <= 0 ? formatter.format(0) : formatter.format(Number(rate.associateRate))).reduce((a, b) => a + b, 0)
        subPracTotal = paymentData.map(x => Number(x.subPracAmount.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
    }

    sortByDateAndName(paymentData)
    let headers = [
        { label: "Date", property: 'batch_date', align: "center" },
        { label: "Invoice Date", property: 'act_date', align: "center" },
        { label: "Individual Name", property: 'service_file_presenting_individual_name', align: "center" },
        { label: "Service Name", property: 'case_program', align: "center" },
        { label: "Cart Item", property: 'description', align: "center" },
        { label: "Invoice ID", property: 'inv_no', align: "center" },
        { label: "Record ID", property: 'rec_id', align: "center" },
        { label: "Worker", property: 'worker', align: "center" },
        { label: "Superviser", property: 'superviser', align: "center" },
        { label: "Qty Charged", property: 'duration_hrs', align: "center" },
        { label: "Applied Amount", property: 'applied_amt', align: "center" },
    ]

    let rows = ['Total', "-", "-", "-", "-", "-", "-", "-", "-", totalDuration_hrs, formatter.format(totalAppliedAmt)]

    if (subPracTotal !== 0 && !rate.isSuperviser) {
        // headers.push({ label: "Go Home Total", property: 'subPracAmount', renderer: null, align: "center" })
        // rows.push(formatter.format(subPracTotal))
    }

    return {
        title: "Applied Payments",
        subtitle: "From " + date.start + " To " + date.end,
        headers: headers,
        datas: [...paymentData],
        rows: [rows],
        L1AssociateFee: associateFee,
        L1AssociateGoHomeTotal: subPracTotal,
    }
}