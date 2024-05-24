const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const { sendEmail } = require("../email/sendEmail");
const { getNonChargeables, getPaymentTypes, getAssociateProfileById, getSupervisers, getPaymentData, getPaymentDataForWorker, getAdjustmentsFeesWorkerOnlyInvoice, getAdjustmentsFeesInvoice, getProfileDates, getInvoiceDataForWorker, getInvoiceData, getSupervisersAssessments, getSupervisersCFIR, getOtherItems } = require("../sql/sql");
const { adjustmentFeeTable } = require("../tables/adjustmentTable");
const { associateFeesAssessments } = require("../tables/associateFeesAssessments");
const { associateFeesTherapy } = require("../tables/associateFeesTherapy");
const { associateFeesTherapyCBT } = require("../tables/associateFeesTherapyCBT");
const { associateFeesTherapyCPRI } = require("../tables/associateFeesTherapyCPRI");
const { duplicateTable } = require("../tables/duplicateTable");
const { mainTable } = require("../tables/mainTable");
const { nonChargeables } = require("../tables/nonChargeables");
const { reportedItemsTable } = require("../tables/reportedItemsTable");
const { getSupervisiesFunc } = require("../tables/supervisiesTable");
const { totalRemittance } = require("../tables/totalRemittance");
const { calculateSuperviseeFeeFunc } = require("./calculateSuperviseeFee");
const { createInvoiceTableFunc, sortByDate, removeNullStr, getUniqueItemsMultiKey, calculateWorkerFeeByLeval, calculateWorkerFeeByLevalCBT, calculateWorkerFeeByLevalCPRI, getProfileDateFormatted } = require("./pdfKitFunctions");
const { duplicateAndSplitFees, duplicateAndSplitFeesRemoved } = require("./removeDuplicateAndSplitFees");
const moment = require('moment');
const { calcSuperviseeAssessmentFeeFunc } = require("./calcSuperviseeAssessmentFeeFunc");
const { OtherChargablesTable } = require("../tables/OtherChargablesTable.js");
const { PDFTYPE, ACTIONTYPE } = require('../pdfWriter/commonEnums.js');
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
                        let emailResp = await sendEmail(associateEmail, worker, pdfData, emailPassword, ACTIONTYPE.INVOICE, index, dateUnformatted)
                        resolve(emailResp)
                    }
                    else { resolve(pdfData) }
                } catch (error) {
                    console.log(error)
                    res.send(500)
                }
            });
            try {
                let workerProfile = await getAssociateProfileById(workerId)
                let profileDates = getProfileDateFormatted(workerProfile[0].startDate, workerProfile[0].endDate)
                let data = reportType === PDFTYPE.SINGLEPDF ?
                    removeNullStr(await getInvoiceDataForWorker(dateUnformatted, worker, profileDates), '-')
                    :
                    removeNullStr(await getInvoiceData(dateUnformatted, worker, profileDates), '-')
                if (!data.length) {
                    // resolve(404)
                }
                let paymentData = reportType === PDFTYPE.SINGLEPDF ?
                    removeNullStr(await getPaymentDataForWorker(worker, dateUnformatted, profileDates), '-')
                    :
                    removeNullStr(await getPaymentData(worker, dateUnformatted, profileDates), '-')

                sortByDate(data)
                let adjustmentFees = await getAdjustmentsFeesWorkerOnlyInvoice(workerId, profileDates)

                let reportedItemDataFiltered = getUniqueItemsMultiKey(data, ['event_service_item_name'])
                reportedItemDataFiltered.map(x => {
                    x.qty = data.filter(i => i.event_service_item_name === x.event_service_item_name).length
                })
                let otherItems = await getOtherItems()
                const otherChargableItems = otherItems.map(x => x.service_name)
                let non_chargeables = await getNonChargeables()
                let non_chargeablesArr = non_chargeables.map(x => x.name)
                let proccessingFeeTypes = await getPaymentTypes()
                let respSuperviser = await getSupervisers(worker, profileDates)
                let respSupervisersCFIR = await getSupervisersCFIR(worker, profileDates)
                let respSuperviserAssessments = await getSupervisersAssessments(worker, profileDates)
                let wokrerLeval = workerProfile[0].associateType
                let isSupervised = workerProfile[0].isSupervised
                let isSuperviser = workerProfile[0].isSuperviser
                let IsSupervisedByNonDirector = workerProfile[0].IsSupervisedByNonDirector
                let associateFeeAssessmentRate = workerProfile[0].assessmentRate
                let associateFeeAssessmentRateCBT = workerProfile[0].assessmentRate_c
                let associateFeeAssessmentRateCPRI = workerProfile[0].assessmentRate_f
                const isl1SupPrac = workerProfile[0].associateType === 'L1 (Sup Prac)'

                //*********************Create supervisees Tables *******************
                let supervisies = await getSupervisiesFunc(dateUnformatted, non_chargeablesArr, respSuperviser, profileDates, worker)

                //*********************format date *******************/
                date = { start: moment.utc(dateUnformatted.start).format('YYYY-MM-DD'), end: moment.utc(dateUnformatted.end).format('YYYY-MM-DD') }

                //******************** REMOVING NON CHARGABLES *********************
                let nonChargeableItems = data.filter(x => non_chargeablesArr.find(n => n === x.event_service_item_name))
                let nonChargableItemsNames = nonChargeableItems.map(x => x.event_service_item_name)

                //******************** REMOVING DUPLICATE & SPLIT FEES (event_id && case_file_name) *********************
                let { duplicateItemsAndSplitFees } = duplicateAndSplitFees(data)
                let { duplicateItemsAndSplitFeesRemoved } = duplicateAndSplitFeesRemoved(data)

                //*******************calculate worker fee by leval *****************
                let removedNonChargablesArr = duplicateItemsAndSplitFeesRemoved.filter(x => !nonChargableItemsNames.includes(x.event_service_item_name))
                let removedNonChargablesArrPayment = paymentData.filter(x => !non_chargeablesArr.includes(x.description))

                let invoiceQty = 0
                let invoiceQtyCBT = 0
                let invoiceQtyCPRI = 0

                if (reportType === PDFTYPE.SINGLEPDF) {
                    invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)
                    invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)
                    invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)

                    if (isNaN(invoiceQty)) {
                        invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                    }
                    else if (isNaN(invoiceQtyCBT)) {
                        invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                    }
                    else if (isNaN(invoiceQtyCPRI)) {
                        invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, removedNonChargablesArr, removedNonChargablesArrPayment, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                    }
                }
                else {
                    let supervisoInvoicerData = removedNonChargablesArr.filter(x => x.event_primary_worker_name.includes(worker))
                    let supervisoPaymenterData = paymentData.filter(x => x.worker === worker)
                    invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, supervisoInvoicerData, supervisoPaymenterData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)
                    invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, supervisoInvoicerData, supervisoPaymenterData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)
                    invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, supervisoInvoicerData, supervisoPaymenterData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                        .map(x => x.invoice_fee_qty || x.duration_hrs).reduce((a, b) => a + b, 0)

                    if (isNaN(invoiceQty) || isNaN(invoiceQtyCBT) || isNaN(invoiceQtyCPRI)) {
                        invoiceQty = calculateWorkerFeeByLeval(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                        invoiceQtyCBT = calculateWorkerFeeByLevalCBT(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                        invoiceQtyCPRI = calculateWorkerFeeByLevalCPRI(wokrerLeval, removedNonChargablesArr, paymentData, false, isSuperviser, isSupervised, IsSupervisedByNonDirector)
                            .map(x => x.duration_hrs || x.invoice_fee_qty).reduce((a, b) => a + b, 0)
                    }

                }

                if (workerProfile[0].associateType === 'L1 (Sup Prac)') {
                    invoiceQty = invoiceQty - duplicateItemsAndSplitFees.length
                }

                //***************other chargable items ******************/
                const otherChargableItemsFilterd = data.filter(x => otherChargableItems.includes(x.event_service_item_name))
                const otherItemsTable = await (await OtherChargablesTable(otherChargableItemsFilterd, date, otherItems, workerProfile[0]))                
                if (otherItemsTable.errorCode === 400) {
                    reject(
                        `${400} No record found in the database for ${otherItemsTable.item.event_service_item_name}. service_name: ${otherItemsTable.item.service_name}.`
                    );
                    return 400;
                }

                const otherItemsTableTotals = otherItemsTable.otherItemsTotal
                    .reduce((acc, item) => {
                        if (!acc[item.org]) {
                            acc[item.org] = {};
                        }
                        if (!acc[item.org][item.type]) {
                            acc[item.org][item.type] = item;
                        }
                        return acc;
                    }, {});

                //***************adjustment fees *****************/
                let adjustmentFeeTableData = adjustmentFeeTable(date, reportType === PDFTYPE.SINGLEPDF ? adjustmentFees : await getAdjustmentsFeesInvoice(worker, profileDates))
                let chargeVideoFee = workerProfile.map(x => x.cahrgeVideoFee)[0]
                let tablesToShow = workerProfile.map((x) => {
                    return {
                        duplicateTable: x.duplicateTable,
                        nonChargeablesTable: x.nonChargeablesTable,
                        associateFeesTable: x.associateFeesTable,
                        totalRemittenceTable: x.totalRemittenceTable,
                        nonRemittablesTable: x.nonRemittablesTable,
                        transactionsTable: x.transactionsTable,
                        superviseeTotalTabel: x.superviseeTotalTabel,
                        appliedPaymentsTotalTable: x.appliedPaymentsTotalTable,
                    }
                })
                let showAdjustmentFeeTable = !adjustmentFeeTableData.datas.every(x => x.name === "-")

                //***********calculate supervisee fee********************/
                let superviseeFeeCalculationTemp = async (tableType, supervisors) => {
                    if (respSuperviser.length >= 0 && reportType !== PDFTYPE.SINGLEPDF) {
                        return (await calculateSuperviseeFeeFunc(dateUnformatted, supervisors, nonChargeableItems,
                            proccessingFeeTypes, videoFee, tableType, profileDates, worker,
                            otherChargableItems, otherChargableItemsFilterd, otherItemsTableTotals))
                    }
                    else return ([])
                }

                let superviseeAssessmentFeeCalculation = async (tableType) => {
                    if (respSuperviser.length >= 0 && reportType !== PDFTYPE.SINGLEPDF) {
                        return (await calcSuperviseeAssessmentFeeFunc(dateUnformatted, respSuperviserAssessments, tableType, profileDates, worker, otherChargableItemsFilterd, otherItemsTableTotals))
                    }
                    else return ([])
                }

                //***************calculate associateship fees  */
                let finalAdjustmentFee = adjustmentFees.filter(x => x.associateName === worker).map(x => JSON.parse(x.adjustmentFee))[0].map(x => Number(x.value)).reduce((a, b) => a + b, 0)

                let associateFeeBaseRateTables = await associateFeesTherapy(worker, invoiceQty, date, workerId, videoFee, proccessingFee, Number(workerProfile[0].blocksBiWeeklyCharge),
                    Number(finalAdjustmentFee), await superviseeFeeCalculationTemp('CFIR', respSupervisersCFIR), chargeVideoFee, removedNonChargablesArr.length,
                    otherItemsTableTotals['CFIR'].therapy.otherItemsTotal, otherItemsTableTotals['CFIR'].therapy.invoice_fee_qty, isl1SupPrac, workerProfile)

                let associateFeeBaseRateTablesCBT = await associateFeesTherapyCBT(worker, invoiceQtyCBT, date, workerId,
                    await superviseeFeeCalculationTemp('CBT', respSuperviser), removedNonChargablesArr.length, isl1SupPrac, workerProfile,
                    otherItemsTableTotals['CBT'].therapy.otherItemsTotal, otherItemsTableTotals['CBT'].therapy.invoice_fee_qty)

                let associateFeeBaseRateTablesCPRI = await associateFeesTherapyCPRI(worker, invoiceQtyCPRI, date, workerId,
                    await superviseeFeeCalculationTemp('CPRI', respSuperviser), removedNonChargablesArr.length, isl1SupPrac, workerProfile,
                    otherItemsTableTotals['CPRI'].therapy.otherItemsTotal, otherItemsTableTotals['CPRI'].therapy.invoice_fee_qty)

                let associateFeeAssessmentTable = await associateFeesAssessments(worker, calculateWorkerFeeByLeval(wokrerLeval, duplicateItemsAndSplitFeesRemoved, removedNonChargablesArrPayment, true),
                    date, associateFeeAssessmentRate, 'CFIR', await superviseeAssessmentFeeCalculation('CFIR'), workerProfile,
                    otherItemsTableTotals['CFIR'].assessment.otherItemsTotal, otherItemsTableTotals['CFIR'].assessment.invoice_fee_qty, otherChargableItems)
                let associateFeeAssessmentTableCBT = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCBT(wokrerLeval, duplicateItemsAndSplitFeesRemoved, removedNonChargablesArrPayment, true),
                    date, associateFeeAssessmentRateCBT, 'CBT', await superviseeAssessmentFeeCalculation('CBT'), workerProfile,
                    otherItemsTableTotals['CBT'].assessment.otherItemsTotal, otherItemsTableTotals['CBT'].assessment.invoice_fee_qty, otherChargableItems)
                let associateFeeAssessmentTableCPRI = await associateFeesAssessments(worker, calculateWorkerFeeByLevalCPRI(wokrerLeval, duplicateItemsAndSplitFeesRemoved, removedNonChargablesArrPayment, true),
                    date, associateFeeAssessmentRateCPRI, 'CPRI', await superviseeAssessmentFeeCalculation('CPRI'), workerProfile,
                    otherItemsTableTotals['CPRI'].assessment.otherItemsTotal, otherItemsTableTotals['CPRI'].assessment.invoice_fee_qty, otherChargableItems)

                let finalTotalRemittence = associateFeeBaseRateTables.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeBaseRateTablesCBT.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeBaseRateTablesCPRI.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                let finalAssociateAssessmentFees = associateFeeAssessmentTable.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeAssessmentTableCBT.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)
                    + associateFeeAssessmentTableCPRI.rows.map(x => Number(x.slice(-1)[0].replace(/[^0-9.-]+/g, ""))).reduce((a, b) => a + b, 0)

                await createInvoiceTableFunc(doc,
                /*Main Table*/  mainTable(data, date),
                /*others table */otherItemsTable,
                /*Reported Items Table*/await reportedItemsTable(reportedItemDataFiltered, date),
                /*Duplicate Items Table*/duplicateTable(duplicateItemsAndSplitFees, date),
                /*Non Chargables Table*/nonChargeables(nonChargeableItems, date),
                /*Adjustment fee table*/adjustmentFeeTableData,
                /*Total Remittence Table*/totalRemittance(date, finalTotalRemittence, netAppliedTotal, finalAssociateAssessmentFees, workerProfile),
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
            throw new Error(err);
        }
    });
}
