const { createPaymentTableFunc, getProfileDateFormatted, getSummarizedData, calculateProcessingFeeTemp, getSummarizedSuperviseeData } = require("./pdfKitFunctions")
const PDFDocument = require("pdfkit-table");
const { nonRemittablesTable } = require("../tables/nonRemittablesTable");
const { getPaymentData, getNonRemittables, getAssociateProfileById, getSuperviseeiesL1, getPaymentDataForWorker, getPaymentTypes, getAdjustmentsFees, getAdjustmentsFeesWorkerOnly, getTablesToShow, getSuperviseeiesL1Assessments } = require("../sql/sql");
const { totalAppliedPaymentsTable } = require("../tables/totalAppliedPaymentsTable");
const { appliedPaymentsTable } = require("../tables/appliedPaymentsTable");
const { transactionsTable } = require("../tables/transactionsTable");
const { superviseeClientPaymentsTable } = require("../tables/superviseeClientPaymentsTable");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { sendEmail } = require("../email/sendEmail");
const { L1SupPracTable } = require("../tables/L1SupPracTable");
const moment = require('moment')

exports.createPaymentReportTable = (res, dateUnformatted, worker, workerId, associateEmail, emailPassword, action, reportType, index) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let netAppliedTotal = 0
        let duration_hrs = 0
        let proccessingFee = 0
        let qty = 0
        let doc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, 'Payment', index)
                    resolve(emailResp)

                }
                else { resolve({ pdfData, netAppliedTotal, duration_hrs, qty, proccessingFee }) }
            } catch (error) {
                res.send(500)
            }
        });



        try {
            let profileDates = await getProfileDateFormatted(workerId)
            let paymentData = reportType === 'singlepdf' ?
                await getPaymentDataForWorker(worker, dateUnformatted, profileDates)
                :
                await getPaymentData(worker, dateUnformatted, profileDates)

            let workerProfile = await getAssociateProfileById(workerId)
            let proccessingFeeTypes = await getPaymentTypes()
            let non_remittableArr = await getNonRemittables()
            let nonRemittableItems = non_remittableArr.map(x => x.name)
            let assessmentMoneyNotToSupervisor = await getSuperviseeiesL1Assessments(worker)
            // let assessmentMoneyNotToSupervisorWorkers = assessmentMoneyNotToSupervisor.map(x => x.associateName)

            let tablesToShow = await getTablesToShow(workerId)
            let adjustmentFees = reportType === 'singlepdf' ? await getAdjustmentsFeesWorkerOnly(worker) : await getAdjustmentsFees(worker)

            //*********************format date *******************/
            date = { start: moment(dateUnformatted.start).format('YYYY-MM-DD'), end: moment(dateUnformatted.end).format('YYYY-MM-DD') }


            //***********************Applied Payments Table ******************/
            let appliedPaymentsTableTemp = await appliedPaymentsTable(date, paymentData, workerId, nonRemittableItems)

            //*************Applied Payments totalRemittance table ****************/
            const getClientPayments = () => { return (paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)) }
            const getClientHours = () => { return (paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)) }

            const getSuperviseeiesClientsPayments = () => { return (paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)) }
            const getSuperviseeiesClientsHours = () => { return (paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)) }

            let clientPayments = 0
            let clientHours = 0
            let superviseeClientsPayment = 0
            let superviseeClientsHours = 0

            if (workerProfile[0].associateType === 'L1 (Sup Prac)') {
                // if(workerProfile[0].associateType){}
                clientPayments = getClientPayments()
                clientHours = getClientHours()
                superviseeClientsPayment = getSuperviseeiesClientsPayments()
                superviseeClientsHours = getSuperviseeiesClientsHours()
            }

            else if (workerProfile[0].isSuperviser) {
                clientPayments = getClientPayments()
                clientHours = getClientHours()
                superviseeClientsPayment = getSuperviseeiesClientsPayments()
                superviseeClientsHours = getSuperviseeiesClientsHours()
            }
            else {
                if (workerProfile[0].supervisorOneGetsMoney === true || workerProfile[0].supervisorTwoGetsMoney === true) {
                    clientPayments = 0
                    clientHours = 0
                    superviseeClientsPayment = 0
                    superviseeClientsHours = 0
                }
                else {
                    clientPayments = getClientPayments()
                    clientHours = getClientHours()
                    superviseeClientsPayment = getSuperviseeiesClientsPayments()
                    superviseeClientsHours = getSuperviseeiesClientsHours()
                }
            }
            //**********L1 Sup PRac Table****************/
            // let superviseeWorkers = await getSuperviseeiesL1Assessments(worker)
            let superviseeWorkers = await getSuperviseeiesL1(worker)
            let L1Tables = superviseeWorkers.map(async (x) => await L1SupPracTable(date, paymentData, x.id, x.associateName, worker))

            //**********Non remittable calculation**************/
            let non_remittableItems = paymentData.filter(x => non_remittableArr.find(n => n.name === x.description))

            //*********transaction calculation****************/
            let tmp = paymentData.filter(x => !nonRemittableItems.includes(x.description))
            let summarizedTransactions = Object.values(getSummarizedData(tmp)).sort()
            // console.log(summarizedTransactions)

            let filtered = getSummarizedSuperviseeData(paymentData)

            //****************adjustment fee table *************/
            let adjustmentFeeTableData = adjustmentFeeTable(date, adjustmentFees)
            let showAdjustmentFeeTable = !adjustmentFeeTableData.datas.every(x => x.name === "-")
            let ajustmentFeesTotal = Number(adjustmentFeeTableData.rows[0][2].replace(/[^0-9.-]+/g, ""))


            let superviseeTbale = superviseeClientPaymentsTable(date, filtered)

            Promise.all(L1Tables).then(async (l1SupPrac) => {
                let totalAppliedAmount = l1SupPrac.map(x => x.rows.map(r => r[6])).map(x => Number(x[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let totalSupPracAmount = l1SupPrac.map(x => x.amountForSuperviser).reduce((a, b) => a + b, 0)
                let totalAppliedHrs = l1SupPrac.map(x => x.rows.map(r => r[5])).map(x => x[0]).reduce((a, b) => a + b, 0)
                let totalSupPraHours = l1SupPrac.map(x => x.hoursForSuperviser).reduce((a, b) => a + b, 0)

                
                await createPaymentTableFunc(doc, worker, non_remittableArr,
                    /*Applied PAyments Table*/appliedPaymentsTableTemp,
                    /*Total applied payments table */ totalAppliedPaymentsTable(date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours, ajustmentFeesTotal, totalAppliedAmount, totalSupPracAmount, totalSupPraHours, totalAppliedHrs),
                    /*nonRemittable Tables*/nonRemittablesTable(date, non_remittableItems),
                    /*Transactions table */transactionsTable(date, summarizedTransactions),
                    /*supervisees clients payments table */ superviseeTbale,
                    /*adjustment fee table */ adjustmentFeeTableData,
                    /*show Adjustment Fee Table or not*/showAdjustmentFeeTable,
                    /*L1 Sup PRac tables*/l1SupPrac,
                    /*type of report*/reportType,
                    /*tables to show from front end */tablesToShow
                )

                //**********calculations for invoice report ************/
                let tempQty = paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description))

                netAppliedTotal = reportType === 'singlepdf' ? (clientPayments + ajustmentFeesTotal)
                    : clientPayments + (superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount + ajustmentFeesTotal
                duration_hrs = paymentData.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                qty = tempQty.length
                proccessingFee = calculateProcessingFeeTemp(proccessingFeeTypes, summarizedTransactions).filter(x => x.worker.includes(worker)).map(x => x.proccessingFee).reduce((a, b) => a + b, 0)
            })
        } catch (error) {
            console.log(error)
        }
    })

}

function compareNames(name1, name2) {
    return name1.includes(name2) || name2.includes(name1);
}