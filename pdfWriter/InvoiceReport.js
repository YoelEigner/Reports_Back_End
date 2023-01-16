const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const { sendEmail } = require("../email/sendEmail");
const { getDataDate, getReportedItems, getNonChargeables, getPaymentTypes, getTablesToShow, getAssociateProfileById, getSupervisers, getPaymentData, getPaymentDataForWorker, getAdjustmentsFeesWorkerOnlyInvoice, getAdjustmentsFeesInvoice, getProfileDates, getDataDateForWorker } = require("../sql/sql");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { associateFeesAssessments } = require("../tables/associateFeesAssessments");
const { associateFeesTherapy, getRate } = require("../tables/associateFeesTherapy");
const { associateFeesTherapyCBT } = require("../tables/associateFeesTherapyCBT");
const { associateFeesTherapyCPRI } = require("../tables/associateFeesTherapyCPRI");
const { duplicateTable } = require("../tables/duplicateTable");
const { mainTable } = require("../tables/mainTable");
const { nonChargeables } = require("../tables/nonChargeables");
const { reportedItemsTable } = require("../tables/reportedItemsTable");
const { getSupervisiesFunc } = require("../tables/supervisiesTable");
const { totalRemittance } = require("../tables/totalRemittance");
const { calculateSuperviseeFeeFunc } = require("./calculateSuperviseeFee");
const { createInvoiceTableFunc, sortByDate, removeNullStr, getUniqueItemsMultiKey, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI } = require("./pdfKitFunctions");
const { duplicateAndSplitFees, duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees");
const moment = require('moment')

exports.createInvoiceTable = async (res, dateUnformatted, worker, workerId, netAppliedTotal, duration_hrs, videoFee, paymentQty, proccessingFee, action, associateEmail, emailPassword, reportType, index) => {
    return new Promise(async (resolve, reject) => {
        try {
            let buffers = [];
            let doc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { printing: 'highResolution', top: 50, bottom: 50, left: 30, right: 30 } });
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                let pdfData = Buffer.concat(buffers);
                try {
                    if (action === 'email') {
                        let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, 'Invoice', index)
                        resolve(emailResp)
                    }
                    else { resolve(pdfData) }
                } catch (error) {
                    console.log(error)
                    res.send(500)
                }
            });
            try {
                let profileDates = await getProfileDates(workerId)
                profileDates.startDate = moment(profileDates.startDate).format('YYYY-MM-DD')
                profileDates.endDate = moment(profileDates.endDate).format('YYYY-MM-DD')

                let data = reportType === 'singlepdf' ?
                    removeNullStr(await getDataDate(dateUnformatted, worker, profileDates), '-')
                    :
                    removeNullStr(await getDataDateForWorker(dateUnformatted, worker, profileDates), '-')

                let paymentData = reportType === 'singlepdf' ?
                    removeNullStr(await getPaymentDataForWorker(worker, dateUnformatted, profileDates), '-')
                    :
                    removeNullStr(await getPaymentData(worker, dateUnformatted, profileDates), '-')

                sortByDate(data)
                let adjustmentFees = await getAdjustmentsFeesWorkerOnlyInvoice(worker, profileDates)
                let reportedItemData = removeNullStr(await getReportedItems(dateUnformatted, worker, profileDates), '-')

                let reportedItemDataFiltered = getUniqueItemsMultiKey(data, ['event_service_item_name'])
                reportedItemDataFiltered.map(x => {
                    x.qty = data.filter(i => i.event_service_item_name === x.event_service_item_name).length
                })

                let non_chargeables = await getNonChargeables()
                let non_chargeablesArr = non_chargeables.map(x => x.name)
                let proccessingFeeTypes = await getPaymentTypes()
                let workerProfile = await getAssociateProfileById(workerId, profileDates)
                let respSuperviser = await getSupervisers(worker, profileDates)
                let wokrerLeval = workerProfile[0].associateType
                let isSupervised = workerProfile[0].isSupervised
                let isSuperviser = workerProfile[0].isSuperviser
                let IsSupervisedByNonDirector = workerProfile[0].IsSupervisedByNonDirector
                let associateFeeAssessmentRate = workerProfile[0].assessmentRate
                let associateFeeAssessmentRateCBT = workerProfile[0].assessmentRate_c
                let associateFeeAssessmentRateCPRI = workerProfile[0].assessmentRate_f
                // let equivalentHours = await getAssessmentItemEquivalent()
                //*********************Create supervisees Tables *******************
                let supervisies = await getSupervisiesFunc(dateUnformatted, non_chargeablesArr, respSuperviser, profileDates)

                //*********************format date *******************/
                date = { start: moment(dateUnformatted.start).format('YYYY-MM-DD'), end: moment(dateUnformatted.end).format('YYYY-MM-DD') }

                //******************** REMOVING NON CHARGABLES *********************
                //check if i need to remove the non charables in the total
                let nonChargeableItems = reportedItemData.filter(x => non_chargeablesArr.find(n => n === x.event_service_item_name) && x.COUNT)
                let nonRemittableItemsNames = nonChargeableItems.map(x => x.event_service_item_name)
                let subtotal = data.map(x => !nonRemittableItemsNames.includes(x.event_service_item_name) && x.event_service_item_total).reduce((a, b) => a + b, 0)


                //******************** REMOVING DUPLICATE & SPLIT FEES (event_id && case_file_name) *********************
                let { duplicateItemsAndSplitFees } = duplicateAndSplitFees(data)
                let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(data)

                //*******************calculate worker fee by leval *****************
                let removedNonChargablesArr = duplicateItemsAndSplitFeesRemoved.filter(x => !nonRemittableItemsNames.includes(x.event_service_item_name))
                let invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length
                let invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length
                let invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector).length

                //***************adjustment fees *****************/

                let adjustmentFeeTableData = adjustmentFeeTable(date, reportType === 'singlepdf' ? adjustmentFees : await getAdjustmentsFeesInvoice(worker, profileDates))
                let chargeVideoFee = workerProfile.map(x => x.cahrgeVideoFee)[0]
                let tablesToShow = await getTablesToShow(workerId)
                let showAdjustmentFeeTable = !adjustmentFeeTableData.datas.every(x => x.name === "-")

                //***********calculate supervisee fee********************/
                // let superviseeFeeCalculation = respSuperviser.length >= 0 && reportType !== 'singlepdf' ? await calculateSuperviseeFeeFunc(dateUnformatted, respSuperviser, non_chargeablesArr, nonChargeableItems,
                //     proccessingFeeTypes, videoFee, null, profileDates) : []
                let superviseeFeeCalculationTemp = async (tableType) => {
                    if (respSuperviser.length >= 0 && reportType !== 'singlepdf') {
                        return (await calculateSuperviseeFeeFunc(dateUnformatted, respSuperviser, non_chargeablesArr, nonChargeableItems,
                            proccessingFeeTypes, videoFee, tableType, profileDates))
                    }
                    else return ([])
                }

                //***************calculate associateship fees  */
                let finalAdjustmentFee = adjustmentFees.map(x => JSON.parse(x.adjustmentFee)[0].value) ? adjustmentFees.map(x => JSON.parse(x.adjustmentFee)[0].value) : 0
                let associateFeeBaseRateTables = await associateFeesTherapy(worker, invoiceQty, date, workerId, videoFee, proccessingFee, Number(workerProfile[0].blocksBiWeeklyCharge),
                    Number(finalAdjustmentFee), await superviseeFeeCalculationTemp('CFIR'), chargeVideoFee, respSuperviser)
                let associateFeeBaseRateTablesCBT = await associateFeesTherapyCBT(worker, invoiceQtyCBT, date, workerId, videoFee, proccessingFee, Number(workerProfile[0].blocksBiWeeklyCharge),
                    0, await superviseeFeeCalculationTemp('CBT'), chargeVideoFee, respSuperviser)
                let associateFeeBaseRateTablesCPRI = await associateFeesTherapyCPRI(worker, invoiceQtyCPRI, date, workerId, videoFee, proccessingFee, Number(workerProfile[0].blocksBiWeeklyCharge),
                    0, await superviseeFeeCalculationTemp('CPRI'), chargeVideoFee, respSuperviser)

                let associateFeeAssessmentTable = await associateFeesAssessments(worker, calculateWorkerFeeByLeval(wokrerLeval, data, paymentData, true), date, associateFeeAssessmentRate, 'CFIR')
                let associateFeeAssessmentTableCBT = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCBT(wokrerLeval, data, paymentData, true), date, associateFeeAssessmentRateCBT, 'CBT')
                let associateFeeAssessmentTableCPRI = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCPRI(wokrerLeval, data, paymentData, true), date, associateFeeAssessmentRateCPRI, 'CPRI')

                let finalTotalRemittence = associateFeeBaseRateTables.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeBaseRateTablesCBT.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeBaseRateTablesCPRI.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let finalAssociateAssessmentFees = associateFeeAssessmentTable.rows.map(x => Number(x[4].replace(/[^0-9.-]+/g, "")))
                    + associateFeeAssessmentTableCBT.rows.map(x => Number(x[4].replace(/[^0-9.-]+/g, "")))
                    + associateFeeAssessmentTableCPRI.rows.map(x => Number(x[4].replace(/[^0-9.-]+/g, "")))

                createInvoiceTableFunc(doc,
                /*Main Table*/  mainTable(data, date),
                /*Reported Items Table*/await reportedItemsTable(reportedItemDataFiltered, date, subtotal, workerId),
                /*Duplicate Items Table*/duplicateTable(duplicateItemsAndSplitFees, date),
                /*Non Chargables Table*/nonChargeables(nonChargeableItems, date),
                /*Adjustment fee table*/adjustmentFeeTableData,
                /*Total Remittence Table*/totalRemittance(date, finalTotalRemittence, netAppliedTotal, finalAssociateAssessmentFees),
                /*Non chargeables Array*/non_chargeablesArr,
                /*worker name*/worker,
                /*Associate Fee base rate table Therapy*/associateFeeBaseRateTables,
                /*Supervisees tbale*/ supervisies,
                /*Duplicate items Array*/duplicateItemsAndSplitFees,
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
