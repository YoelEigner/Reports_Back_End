const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const { sendEmail } = require("../email/sendEmail");
const { getData, getDataDate, getDataUser, getReportedItems, getNonChargeables, getAssociateVideoFee, getPaymentTypes, getProcessingFee, getTablesToShow, getAssociateProfileById, getSupervisers, getPaymentData, getPaymentDataForWorker, getAssessmentItemEquivalent, getDataDateA__, getDataDateT_c_, getDataDateA_c_, getDataDateA_f_, getDataDateT_f_ } = require("../sql/sql");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { associateFeesAssessments } = require("../tables/associateFeesAssessments");
const { associateFeesTherapy, getRate } = require("../tables/associateFeesTherapy");
const { associateFeesTherapyCBT } = require("../tables/associateFeesTherapyCBT");
const { associateFeesTherapyCPRI } = require("../tables/associateFeesTherapyCPRI");
const { blockItemsTable } = require("../tables/blockItemsTable");
const { calculateAssociateFeeForSupervisee } = require("../tables/calculateAssociateFeeForSupervisee.js");
const { duplicateTable } = require("../tables/duplicateTable");
const { footerTable } = require("../tables/footerTables");
const { mainTable } = require("../tables/mainTable");
const { nonChargeables } = require("../tables/nonChargeables");
const { reportedItemsTable } = require("../tables/reportedItemsTable");
const { subPracTable } = require("../tables/subPracTable");
const { supervisiesTable, getSupervisiesFunc } = require("../tables/supervisiesTable");
const { totalRemittance } = require("../tables/totalRemittance");
const { calculateSuperviseeFeeFunc } = require("./calculateSuperviseeFee");
const { createInvoiceTableFunc, getNotUnique, getSupervisies, formatter, sortByDate, removeNull, removeNullStr, removeNaN, getUniqueByMulti, getUniqueItemsMultiKey, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI } = require("./pdfKitFunctions");
const { removeDuplicateAndSplitFees } = require("./removeDuplicateAndSplitFees");

exports.createInvoiceTable = async (res, dateUnformatted, worker, workerId, netAppliedTotal, duration_hrs, videoFee, paymentQty, proccessingFee, action, associateEmail, emailPassword, reportType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let buffers = [];
            let doc = new PDFDocument({ bufferPages: true, margins: { printing: 'highResolution', top: 50, bottom: 50, left: 30, right: 30 } });
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                let pdfData = Buffer.concat(buffers);
                try {
                    if (action === 'email') {
                        let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, 'Invoice')
                        resolve(emailResp)
                    }
                    else { resolve(pdfData) }
                } catch (error) {
                    console.log(error)
                    res.send(500)
                }
            });
            try {

                let data = removeNullStr(await getDataDate(dateUnformatted, worker), '-')

                // let paymentData = removeNullStr(await getPaymentData(worker, dateUnformatted), '-')
                let paymentData = reportType === 'singlepdf' ? removeNullStr(await getPaymentDataForWorker(worker, dateUnformatted), '-')
                    : removeNullStr(await getPaymentData(worker, dateUnformatted), '-')
                sortByDate(data)

                let reportedItemData = removeNullStr(await getReportedItems(dateUnformatted, worker), '-')

                let reportedItemDataFiltered = getUniqueItemsMultiKey(data, ['event_service_item_name'])
                reportedItemDataFiltered.map(x => {
                    x.qty = data.filter(i => i.event_service_item_name === x.event_service_item_name).length
                })

                let non_chargeables = await getNonChargeables()
                let non_chargeablesArr = non_chargeables.map(x => x.name)
                let proccessingFeeTypes = await getPaymentTypes()
                let workerProfile = await getAssociateProfileById(workerId)
                let respSuperviser = await getSupervisers(worker)
                let wokrerLeval = workerProfile[0].associateType
                let isSupervised = workerProfile[0].isSupervised
                let isSuperviser = workerProfile[0].isSuperviser
                let IsSupervisedByNonDirector = workerProfile[0].IsSupervisedByNonDirector
                let associateFeeAssessmentRate = workerProfile[0].assessmentRate
                let associateFeeAssessmentRateCBT = workerProfile[0].assessmentRate_c
                let associateFeeAssessmentRateCPRI = workerProfile[0].assessmentRate_f
                let equivalentHours = await getAssessmentItemEquivalent()
                //*********************Create supervisees Tables *******************
                let supervisies = await getSupervisiesFunc(dateUnformatted, non_chargeablesArr, respSuperviser)

                //*********************format date *******************/
                let tempDateStart = dateUnformatted.start.split("/")[1] + "/" + dateUnformatted.start.split("/")[2] + "/" + dateUnformatted.start.split("/")[0]
                let tempDateEnd = dateUnformatted.end.split("/")[1] + "/" + dateUnformatted.end.split("/")[2] + "/" + dateUnformatted.end.split("/")[0]
                date = { start: tempDateStart, end: tempDateEnd }

                //******************** REMOVING NON CHARGABLES *********************
                //check if i need to remove the non charables in the total
                let nonChargeableItems = reportedItemData.filter(x => non_chargeablesArr.find(n => n === x.event_service_item_name) && x.COUNT)
                let nonRemittableItemsNames = nonChargeableItems.map(x => x.event_service_item_name)
                let subtotal = data.map(x => !nonRemittableItemsNames.includes(x.event_service_item_name) && x.event_service_item_total).reduce((a, b) => a + b, 0)

                //*******************calculate worker fee by leval *****************
                let removedNonChargablesArr = data.filter(x => !nonRemittableItemsNames.includes(x.event_service_item_name))
                let invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length
                let invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length
                let invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length


                //******************** REMOVING DUPLICATE & SPLIT FEES (event_id && case_file_name) *********************
                let { duplicateItems, duplicateItemsId } = removeDuplicateAndSplitFees(data)

                //************** ASSOCIATE FEE BASE RATE CALCULATION **********************
                /*COUNT ALL DUPLICATE/SPILIT FEES LEAVING ONLY ONE*/
                let associateFeeTableQty = 0
                if (workerProfile[0].associateType === 'L1' || workerProfile[0].associateType === 'L2') {
                    associateFeeTableQty = data.length - Math.max(nonChargeableItems.map(x => x.COUNT).reduce((a, b) => a + b, 0), 0)
                        - Math.max((duplicateItems.length - getNotUnique(duplicateItemsId.map(x => x.event_id)).length), 0)
                }
                else {
                    associateFeeTableQty = paymentData.length - Math.max(nonChargeableItems.map(x => x.COUNT).reduce((a, b) => a + b, 0), 0)
                        - Math.max((duplicateItems.length - getNotUnique(duplicateItemsId.map(x => x.event_id)).length), 0)
                }


                //***************adjustment fees *****************/
                let adjustmentFee = JSON.parse(workerProfile.map(x => x.adjustmentFee))
                let adjustmentFeeTableData = adjustmentFeeTable(date, adjustmentFee)
                let chargeVideoFee = workerProfile.map(x => x.cahrgeVideoFee)[0]
                // let blocksBiWeeklyCharge = parseFloat(workerProfile.map(x => x.blocksBiWeeklyCharge)[0])
                let tablesToShow = await getTablesToShow(workerId)
                let showAdjustmentFeeTable = adjustmentFee.length >= 1 && adjustmentFee[0].name !== ''

                //***********calculate supervisee fee********************/
                let superviseeFeeCalculation = respSuperviser.length >= 0 && reportType !== 'singlepdf' ? await calculateSuperviseeFeeFunc(dateUnformatted, respSuperviser, non_chargeablesArr, nonChargeableItems,
                    proccessingFeeTypes, videoFee) : []

                //***************calculate associateship fees  */
                let associateFeeBaseRateTables = await associateFeesTherapy(worker, invoiceQty, date, workerId, videoFee, proccessingFee, workerProfile[0].blocksBiWeeklyCharge,
                    Number(adjustmentFeeTableData.rows[0][2].replace(/[^0-9.-]+/g, "")), superviseeFeeCalculation, chargeVideoFee, respSuperviser)
                let associateFeeBaseRateTablesCBT = await associateFeesTherapyCBT(worker, invoiceQtyCBT, date, workerId, videoFee, proccessingFee, workerProfile[0].blocksBiWeeklyCharge,
                    Number(adjustmentFeeTableData.rows[0][2].replace(/[^0-9.-]+/g, "")), superviseeFeeCalculation, chargeVideoFee, respSuperviser)
                let associateFeeBaseRateTablesCPRI = await associateFeesTherapyCPRI(worker, invoiceQtyCPRI, date, workerId, videoFee, proccessingFee, workerProfile[0].blocksBiWeeklyCharge,
                    Number(adjustmentFeeTableData.rows[0][2].replace(/[^0-9.-]+/g, "")), superviseeFeeCalculation, chargeVideoFee, respSuperviser)

                let associateFeeAssessmentTable = await associateFeesAssessments(worker, calculateWorkerFeeByLeval(wokrerLeval, data, paymentData, true), dateUnformatted, associateFeeAssessmentRate)
                let associateFeeAssessmentTableCBT = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCBT(wokrerLeval, data, paymentData, true), dateUnformatted, associateFeeAssessmentRateCBT)
                let associateFeeAssessmentTableCPRI = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCPRI(wokrerLeval, data, paymentData, true), dateUnformatted, associateFeeAssessmentRateCPRI)

                let finalTotalRemittence = associateFeeBaseRateTables.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let finalAssociateAssessmentFees = associateFeeAssessmentTable.rows.map(x => Number(x[4].replace(/[^0-9.-]+/g, "")))
                createInvoiceTableFunc(doc,
                /*Main Table*/  mainTable(data, date),
                /*Reported Items Table*/await reportedItemsTable(reportedItemDataFiltered, date, subtotal, workerId),
                /*Duplicate Items Table*/duplicateTable(duplicateItems, date),
                /*Non Chargables Table*/nonChargeables(nonChargeableItems, date),
                /*Adjustment fee table*/adjustmentFeeTableData,
                /*Total Remittence Table*/totalRemittance(date, finalTotalRemittence, netAppliedTotal, finalAssociateAssessmentFees[0]),
                /*Non chargeables Array*/non_chargeablesArr,
                /*worker name*/worker,
                /*Associate Fee base rate table Therapy*/associateFeeBaseRateTables,
                /*Supervisees tbale*/ supervisies,
                /*Duplicate items Array*/duplicateItems,
                /*tables to show*/ tablesToShow,
                /*show adjustment fee tbale or not*/showAdjustmentFeeTable,
                // /* in office block table*/blockItemFees,
                /*AssociateFees Assessments*/ associateFeeAssessmentTable,
                /*report type */ reportType,
                /*Associate Fee base rate table Therapy CBT*/associateFeeBaseRateTablesCBT,
                /*Associate Fee base rate table Assessments CBT*/associateFeeAssessmentTableCBT,
                /*Associate Fee base rate table Therapy CPRI*/associateFeeBaseRateTablesCPRI,
                /*Associate Fee base rate table Assessments CBT*/associateFeeAssessmentTableCPRI,
                    /*L1 supervised pratice table await subPracTable(dateUnformatted, tempWorker)*/
                )

            } catch (error) {
                console.log(error)
                return error
            }
        } catch (err) {
            console.log(err)
            reject(err)
        }
    });
}
