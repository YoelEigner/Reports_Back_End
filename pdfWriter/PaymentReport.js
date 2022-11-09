const { createPaymentTableFunc, formatter, sortByDate, sortByName, removeSupPrac, getUniqueItemsMultiKey, matchUser } = require("./pdfKitFunctions")
const PDFDocument = require("pdfkit-table");
const { nonRemittablesTable } = require("../tables/nonRemittablesTable");
const { thirdPartyFeesTable } = require("../tables/thirdPartyFeesTable");
const { getPaymentData, getNonRemittables, getAssociateProfileById, getAssociateProfileByName, getAllSuperviseeProfiles, getSuperviseePaymentData, getSuperviseeies, getSupervisers, getWorkerId, getSuperviseeiesL1 } = require("../sql/sql");
const { totalAppliedPaymentsTable } = require("../tables/totalAppliedPaymentsTable");
const { appliedPaymentsTable } = require("../tables/appliedPaymentsTable");
const { transactionsTable } = require("../tables/transactionsTable");
const { superviseeClientPaymentsTable } = require("../tables/superviseeClientPaymentsTable");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { sendEmail } = require("../email/sendEmail");
const { getSupervisiesFunc } = require("../tables/supervisiesTable");
const { L1SupPracTable } = require("../tables/L1SupPracTable");

exports.createPaymentReportTable = (res, dateUnformatted, worker, workerId, associateEmail, emailPassword, action) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let netAppliedTotal = 0
        let duration_hrs = 0
        let doc = new PDFDocument({ bufferPages: true, margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, 'Payment')
                    resolve(emailResp)
                }
                else { resolve({ pdfData, netAppliedTotal, duration_hrs }) }
            } catch (error) {
                res.send(500)
            }
        });



        try {
            let tempWorker = String(worker.split(",")[1] + " " + worker.split(",")[0]).trim()
            let paymentData = await getPaymentData(tempWorker, worker, dateUnformatted)
            // let paymentData = removeSupPrac(paymentDataTemp, worker)
            sortByName(paymentData)
            let workerProfile = await getAssociateProfileById(workerId)

            let non_remittableArr = await getNonRemittables()
            let nonRemittableItems = non_remittableArr.map(x => x.name)

            const superviseePaymentData = async (worker) => {
                let workerPaymentData = await getSuperviseePaymentData(worker.split(',')[1].trim() + " " + worker.split(',')[0].trim(), dateUnformatted)
                let superviseePayments = workerPaymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                let superviseeHours = workerPaymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                return { superviseePayments, superviseeHours }
            }


            //*********************format date *******************/
            let tempDateStart = dateUnformatted.start.split("/")[1] + "/" + dateUnformatted.start.split("/")[2] + "/" + dateUnformatted.start.split("/")[0]
            let tempDateEnd = dateUnformatted.end.split("/")[1] + "/" + dateUnformatted.end.split("/")[2] + "/" + dateUnformatted.end.split("/")[0]
            date = { start: tempDateStart, end: tempDateEnd }

            //***********************Applied Payments Table ******************/
            let appliedPaymentsTableTemp = await appliedPaymentsTable(date, paymentData, workerId, nonRemittableItems)

            //*************Applied Payments total table ****************/
            const getClientPaymentsFromSupervisee = (data) => { return (data.length === 0 ? 0 : data.map(x => x.superviseePayments).reduce((a, b) => a + b)) }
            const getlientHoursFromSupervisee = (data) => { return (data.length === 0 ? 0 : data.map(x => x.superviseeHours).reduce((a, b) => a + b)) }
            const getClientPayments = () => { return (paymentData.filter(x => x.worker.trim() === tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)) }
            const getClientHours = () => { return (paymentData.filter(x => x.worker.trim() === tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)) }

            //removing non remittables && !nonRemittableItems.includes(x.description)
            let clientPayments = 0
            let clientHours = 0
            let superviseeClientsPayment = 0
            let superviseeClientsHours = 0

            if (workerProfile[0].associateType === 'L1 (Sup Prac)') {
                clientPayments = Number(appliedPaymentsTableTemp.rows.map(x => x[7] !== undefined ? x[7] : '$0.00')[0].replace(/[^0-9.-]+/g, ""))//count for unbdefined
                clientHours = getClientHours()
                superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
            }

            else if (workerProfile[0].isSuperviser) {
                clientPayments = getClientPayments()
                clientHours = getClientHours()
                superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)

                // let superviseeies = await getSuperviseeies(worker)
                // let mapSuperviseeies = superviseeies.map(async (x) => await superviseePaymentData(x.associateName))
                // await Promise.all(mapSuperviseeies).then((data) => {
                //     try {
                //         let clientPaymentsFromSupervisee = getClientPaymentsFromSupervisee(data)
                //         let clientHoursFromSupervisee = getlientHoursFromSupervisee(data)
                //         clientPayments = getClientPayments()
                //         clientHours = getClientHours()
                //         superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                //         superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                //     } catch (error) {

                //     }
                // })
            }
            else {
                if (workerProfile[0].supervisorOneGetsMoney === true || workerProfile[0].supervisorTwoGetsMoney === true) {
                    clientPayments = 0
                    clientHours = 0
                    superviseeClientsPayment = 0
                    superviseeClientsHours = 0
                }
                else {
                    clientPayments = paymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                    clientHours = paymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                    superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                    superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== tempWorker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                }
            }

            //**********L1 Sup PRac Table****************/
            let superviseeWorkers = await getSuperviseeiesL1(worker)
            let L1Tables = superviseeWorkers.map(async (x) => await L1SupPracTable(date, paymentData, x.id, x.associateName))

            //**********Non remittable calculation**************/
            let non_remittableItems = paymentData.filter(x => non_remittableArr.find(n => n.name === x.description))

            //*********transaction calculation****************/

            const uniqueTransactions = [...new Set(paymentData.map(item => item.rec_id))]
            let arrayOftransations = uniqueTransactions.map(x => paymentData.filter(i => i.rec_id === x))
            arrayOftransations.sort()
            arrayOftransations.map((x) => {
                x.map(i => i.quantity = x.length)
                x[0].total_amt = formatter.format(x.map(i => i.applied_amt).reduce((a, b) => a + b, 0))
                x.map(i => i.applied_amt = formatter.format(i.applied_amt))
            })

            //*************** to be detucted tbale (superviseeClientPaymentsTable) **************/
            let filtered = getUniqueItemsMultiKey(paymentData, ['worker', 'description'])

            filtered.map(async (x) => {
                x.qty = paymentData.filter(i => i.description === x.description && i.worker === x.worker).length
                x.total = formatter.format(paymentData.filter(i => i.description === x.description && i.worker === x.worker)
                    .map(i => Number(i.applied_amt.replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0))
            })

            //****************adjustment fee table *************/
            let adjustmentFee = JSON.parse(workerProfile.map(x => x.adjustmentPaymentFee))
            let adjustmentFeeTableData = adjustmentFeeTable(date, adjustmentFee)
            let showAdjustmentFeeTable = adjustmentFee.length >= 1 && adjustmentFee[0].name !== ''
            let ajustmentFeesTotal = Number(adjustmentFeeTableData.rows[0][1].replace(/[^0-9.-]+/g, ""))

            Promise.all(L1Tables).then((l1SupPrac) => {
                let totalAppliedAmount = l1SupPrac.map(x => x.rows.map(r => r[6])).map(x => Number(x[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let totalSupPracAmount = l1SupPrac.map(x => x.amountForSuperviser).reduce((a, b) => a + b, 0)
                // console.log(l1SupPrac.map(x => x.amountForSuperviser))

                createPaymentTableFunc(doc, worker, non_remittableArr,
                    /*Applied PAyments Table*/appliedPaymentsTableTemp,
                    /*Total applied payments table */ totalAppliedPaymentsTable(date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours, ajustmentFeesTotal, totalAppliedAmount, totalSupPracAmount),
                    /*nonRemittable Tables*/nonRemittablesTable(date, non_remittableItems),
                    /*Transactions table */transactionsTable(date, arrayOftransations),
                    /*supervisees clients payments table */ superviseeClientPaymentsTable(date, filtered),
                    /*adjustment fee table */ adjustmentFeeTableData,
                    /*show Adjustment Fee Table or not*/showAdjustmentFeeTable,
                    /*L1 Sup PRac tables*/l1SupPrac,
                    // /*Transactions table */transactionsTable(date, paymentData.sort((a, b) => (a.superviser > b.superviser) ? 1 : -1))
                )

                //**********calculations for invoice report ************/
                netAppliedTotal = clientPayments + ((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount) - ajustmentFeesTotal
                duration_hrs = paymentData.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
            })
        } catch (error) {
            console.log(error)
        }
    })

}