const { createPaymentTableFunc, sortByDate, sortByName, removeSupPrac, getUniqueItemsMultiKey, matchUser, getFeeAmount, removeNaN, calculateProccessingFee, convertToInt } = require("./pdfKitFunctions")
const PDFDocument = require("pdfkit-table");
const { nonRemittablesTable } = require("../tables/nonRemittablesTable");
const { thirdPartyFeesTable } = require("../tables/thirdPartyFeesTable");
const { getPaymentData, getNonRemittables, getAssociateProfileById, getAssociateProfileByName, getAllSuperviseeProfiles, getSuperviseePaymentData, getSuperviseeies, getSupervisers, getWorkerId, getSuperviseeiesL1, getPaymentDataForWorker, getPaymentTypes, getNonChargeables, getAdjustmentsFees, getAdjustmentsFeesWorkerOnly, getTablesToShow } = require("../sql/sql");
const { totalAppliedPaymentsTable } = require("../tables/totalAppliedPaymentsTable");
const { appliedPaymentsTable } = require("../tables/appliedPaymentsTable");
const { transactionsTable } = require("../tables/transactionsTable");
const { superviseeClientPaymentsTable } = require("../tables/superviseeClientPaymentsTable");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { sendEmail } = require("../email/sendEmail");
const { getSupervisiesFunc } = require("../tables/supervisiesTable");
const { L1SupPracTable } = require("../tables/L1SupPracTable");
const { removeDuplicateAndSplitFees } = require("./removeDuplicateAndSplitFees");
const { json } = require("express");

exports.createPaymentReportTable = (res, dateUnformatted, worker, workerId, associateEmail, emailPassword, action, reportType) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let netAppliedTotal = 0
        let duration_hrs = 0
        let proccessingFee = 0
        // let L1AssociateFee = 0
        let qty = 0
        let doc = new PDFDocument({ bufferPages: true, margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, 'Payment')
                    resolve(emailResp)
                }
                else { resolve({ pdfData, netAppliedTotal, duration_hrs, qty, proccessingFee }) }
            } catch (error) {
                res.send(500)
            }
        });



        try {
            // let tempWorker = String(worker.split(",")[1] + " " + worker.split(",")[0]).trim()
            // let paymentData = await getPaymentData(worker, dateUnformatted)
            let paymentData = reportType === 'singlepdf' ? await getPaymentDataForWorker(worker, dateUnformatted) : await getPaymentData(worker, dateUnformatted)

            let workerPaymentData = await getPaymentDataForWorker(worker, dateUnformatted)
            // let paymentData = removeSupPrac(paymentDataTemp, worker)
            let workerProfile = await getAssociateProfileById(workerId)
            let proccessingFeeTypes = await getPaymentTypes()
            let non_remittableArr = await getNonRemittables()
            let nonRemittableItems = non_remittableArr.map(x => x.name)
            let tablesToShow = await getTablesToShow(workerId)

            let adjustmentFees = reportType === 'singlepdf' ? await getAdjustmentsFeesWorkerOnly(worker) : await getAdjustmentsFees(worker)
            // const superviseePaymentData = async (worker) => {
            //     let workerPaymentData = await getSuperviseePaymentData(worker.split(',')[1].trim() + " " + worker.split(',')[0].trim(), dateUnformatted)
            //     let superviseePayments = workerPaymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
            //     let superviseeHours = workerPaymentData.filter(x => !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
            //     return { superviseePayments, superviseeHours }
            // }


            //*********************format date *******************/
            let tempDateStart = dateUnformatted.start.split("/")[1] + "/" + dateUnformatted.start.split("/")[2] + "/" + dateUnformatted.start.split("/")[0]
            let tempDateEnd = dateUnformatted.end.split("/")[1] + "/" + dateUnformatted.end.split("/")[2] + "/" + dateUnformatted.end.split("/")[0]
            date = { start: tempDateStart, end: tempDateEnd }

            //***********************Applied Payments Table ******************/
            let appliedPaymentsTableTemp = await appliedPaymentsTable(date, paymentData, workerId, nonRemittableItems)

            //*************Applied Payments total table ****************/
            const getClientPayments = () => { return (paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)) }
            const getClientHours = () => { return (paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)) }

            let clientPayments = 0
            let clientHours = 0
            let superviseeClientsPayment = 0
            let superviseeClientsHours = 0

            if (workerProfile[0].associateType === 'L1 (Sup Prac)') {
                clientPayments = getClientPayments()
                clientHours = getClientHours()
                superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
            }

            else if (workerProfile[0].isSuperviser) {
                clientPayments = getClientPayments()
                clientHours = getClientHours()
                superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
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
                    superviseeClientsPayment = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.applied_amt).reduce((a, b) => a + b, 0)
                    superviseeClientsHours = paymentData.filter(x => x.worker.trim() !== worker && !nonRemittableItems.includes(x.description)).map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
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
                x[0].total_amt = x.map(i => i.applied_amt).reduce((a, b) => a + b, 0)
                x.map(i => i.applied_amt = i.applied_amt)
            })



            //*************** to be detucted tbale (superviseeClientPaymentsTable) **************/
            let filtered = getUniqueItemsMultiKey(paymentData, ['worker', 'description'])
            filtered.map(async (x) => {
                x.qty = paymentData.filter(i => i.description === x.description && i.worker === x.worker).length
                x.total = paymentData.filter(i => i.description === x.description && i.worker === x.worker)
                    .map(i => i.applied_amt).reduce((a, b) => a + b, 0)
            })

            //****************adjustment fee table *************/
            let adjustmentFeeTableData = adjustmentFeeTable(date, adjustmentFees)
            let showAdjustmentFeeTable = !adjustmentFeeTableData.datas.every(x => x.name === "-")
            let ajustmentFeesTotal = Number(adjustmentFeeTableData.rows[0][2].replace(/[^0-9.-]+/g, ""))

            Promise.all(L1Tables).then((l1SupPrac) => {
                let totalAppliedAmount = l1SupPrac.map(x => x.rows.map(r => r[6])).map(x => Number(x[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let totalSupPracAmount = l1SupPrac.map(x => x.amountForSuperviser).reduce((a, b) => a + b, 0)


                createPaymentTableFunc(doc, worker, non_remittableArr,
                    /*Applied PAyments Table*/appliedPaymentsTableTemp,
                    /*Total applied payments table */ totalAppliedPaymentsTable(date, clientPayments, clientHours, superviseeClientsPayment, superviseeClientsHours, ajustmentFeesTotal, totalAppliedAmount, totalSupPracAmount),
                    /*nonRemittable Tables*/nonRemittablesTable(date, non_remittableItems),
                    /*Transactions table */transactionsTable(date, arrayOftransations),
                    /*supervisees clients payments table */ superviseeClientPaymentsTable(date, filtered),
                    /*adjustment fee table */ adjustmentFeeTableData,
                    /*show Adjustment Fee Table or not*/showAdjustmentFeeTable,
                    /*L1 Sup PRac tables*/l1SupPrac,
                    /*type of report*/reportType,
                    /*tables to show from front end */tablesToShow
                )

                //**********calculations for invoice report ************/
                arrayOftransations.flat().map(x => x.applied_amt = Number(x.applied_amt.replace(/[^0-9.-]+/g, "")))
                let tempQty = paymentData.filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description))
                /*remove non chargables*/
                let tempArrayOftransations = arrayOftransations.map(x => x[0]).filter(x => x.worker.trim() === worker && !nonRemittableItems.includes(x.description))
                /*remove non chargables*/
                // netAppliedTotal = (clientPayments + ((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount) - ajustmentFeesTotal)
                netAppliedTotal = reportType === 'singlepdf' ? (clientPayments - ajustmentFeesTotal)
                    : (clientPayments + ((superviseeClientsPayment - totalAppliedAmount) + totalSupPracAmount) - ajustmentFeesTotal)
                duration_hrs = paymentData.map(x => x.duration_hrs).reduce((a, b) => a + b, 0)
                qty = tempQty.length
                proccessingFee = calculateProccessingFee(tempArrayOftransations, proccessingFeeTypes, workerProfile[0].associateType).reduce((a, b) => a + b, 0)
            })
        } catch (error) {
            console.log(error)
        }
    })

}