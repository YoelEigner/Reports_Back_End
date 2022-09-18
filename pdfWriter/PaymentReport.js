const { createPaymentTableFunc, formatter, sortByDate } = require("./pdfKitFunctions")
const PDFDocument = require("pdfkit-table");
const { nonRemittablesTable } = require("../tables/nonRemittablesTable");
const { thirdPartyFeesTable } = require("../tables/thirdPartyFeesTable");
const { getPaymentData, getNonRemittables, getAssociateProfileById } = require("../sql/sql");
const { totalAppliedPaymentsTable } = require("../tables/totalAppliedPaymentsTable");
const { appliedPaymentsTable } = require("../tables/appliedPaymentsTable");
const { transactionsTable } = require("../tables/transactionsTable");
const { superviseeClientPaymentsTable } = require("../tables/superviseeClientPaymentsTable");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { sendEmail } = require("../email/sendEmail");

exports.createPaymentReportTable = (res, date, worker, workerId, associateEmail, emailPassword, action) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let netAppliedTotal = 0
        let duration_hrs = 0
        let doc = new PDFDocument({ bufferPages: true, margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    // sendEmail(associateEmail, worker, pdfData, emailPassword)
                    setTimeout(() => {
                        resolve(200)
                    }, 2000);
                }
                else { resolve({ pdfData, netAppliedTotal, duration_hrs }) }
            } catch (error) {
                res.send(500)
            }
        });

        try {
            let tempWorker = String(worker.split(",")[1] + " " + worker.split(",")[0]).trim()
            let superviser = worker
            let paymentData = await getPaymentData(tempWorker, superviser, date)
            sortByDate(paymentData)
            let workerProfile = await getAssociateProfileById(workerId)

            let non_remittableArr = await getNonRemittables()
            let nonRemittableItems = non_remittableArr.map(x => x.name)

            //*************Applied Payments table ****************/
            //removing non remittables && !nonRemittableItems.includes(x.description)
            let clientPayments = 0
            let clientHours = 0
            let superviseeClientsPayment = 0
            let superviseeClientsHours = 0
            if (workerProfile[0].supervisorGetsMoney) {
                clientPayments = paymentData.filter(x => x.worker.trim() === tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                clientHours = paymentData.filter(x => x.worker.trim() === tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
            }
            else {
                clientPayments = paymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                clientHours = paymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                superviseeClientsPayment = 0
                superviseeClientsHours = 0
            }

            //**********calculations for invoice report ************/
            netAppliedTotal = clientPayments + superviseeClientsPayment
            duration_hrs = paymentData.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)

            //**********Non remittable calculation**************/
            let non_remittableItems = paymentData.filter(x => non_remittableArr.find(n => n.name === x.description))


            //*********transaction calculation****************/

            const uniqueTransactions = [...new Set(paymentData.map(item => item.rec_id))]
            let arrayOftransations = uniqueTransactions.map(x => paymentData.filter(i => i.rec_id === x))
            arrayOftransations.map((x) => {
                x.map(i => i.quantity = x.length)
                x[0].total_amt = formatter.format(x.map(i => i.applied_amt).reduce((a, b) => a + b, 0))
                x.map(i => i.applied_amt = formatter.format(i.applied_amt))
            })

            //*************** to be detucted tbale (superviseeClientPaymentsTable) **************/
            let uniqItems = [...new Set(paymentData.map(x => x.description))];
            let separatedItems = uniqItems.map(x => paymentData.filter(i => i.description === x))
            separatedItems.map((x) => {
                x[0].qty = x.length
                x[0].total = formatter.format(x.map(i => Number(i.applied_amt.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0))

            })
            let finalItemCount = separatedItems.map(x => x[0])
            //****************adjustment fee table *************/
            let adjustmentFee = JSON.parse(workerProfile.map(x => x.adjustmentPaymentFee))
            let adjustmentFeeTableData = adjustmentFeeTable(date, adjustmentFee)
            let showAdjustmentFeeTable = adjustmentFee.length === 1 && adjustmentFee[0].name !== ''

            createPaymentTableFunc(doc, worker, non_remittableArr,
                /*Applied PAyments Table*/appliedPaymentsTable(date, paymentData, nonRemittableItems),
                /*Total applied payments table */ totalAppliedPaymentsTable(date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours),
                /*nonRemittable Tables*/nonRemittablesTable(date, non_remittableItems),
                // /*third party payments*/ thirdPartyFeesTable(date, 0, 0, 0),
                /*Transactions table */transactionsTable(date, arrayOftransations),
                /*supervisees clients payments table */ superviseeClientPaymentsTable(date, finalItemCount),
                /*adjustment fee table */ adjustmentFeeTableData,
                /*show Adjustment Fee Table or not*/showAdjustmentFeeTable
                // /*Transactions table */transactionsTable(date, paymentData.sort((a, b) => (a.superviser > b.superviser) ? 1 : -1))
            )
        } catch (error) {
            console.log(error)
        }
    })

}