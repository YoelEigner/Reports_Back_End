var firstBy = require('thenby');
const { getSuperviseeies, getProfileDates } = require("../sql/sql");
const moment = require('moment')


exports.generateHeader = (doc, worker) => {
    doc
        .fontSize(20)
        .text('Invoice Report For : ' + worker, 0, 50, { align: 'center' })
        .font('Helvetica-Bold')

}
exports.generatePaymentHeader = (doc, worker) => {
    doc
        .fontSize(20)
        .text('Payment Report For : ' + worker, 0, 50, { align: 'center' })
        .font('Helvetica-Bold')

}

exports.generateLine = (doc, y) => {
    doc.strokeColor("black")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(740, doc.y)
        .stroke()
        .moveDown()
}

exports.generateFooter = (doc) => {
    doc
        .fontSize(10)
        .text(
            "Payment is due within 15 days. Thank you for your business.",
            50,
            780,
            { align: "center", width: 500 }
        );
}

exports.getNotUnique = (array) => {
    var map = new Map();
    array.forEach(a => map.set(a, (map.get(a) || 0) + 1));
    let newArr = array.filter(a => map.get(a) > 1);
    return [...new Set(newArr)];
}

exports.uniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
}
exports.getUniqueByMulti = (data) => {
    var resArr = [];

    data.filter(function (item) {
        var i = resArr.findIndex(x => (x.inv_no == item.inv_no));
        if (i <= -1) {
            resArr.push(item);
        }
        return null;
    });
    return resArr

}

const virticalLines = (doc, rectCell, indexColumn) => {
    const { x, y, width, height } = rectCell;
    // first line 
    if (indexColumn === 0) {
        doc
            .lineWidth(.5)
            .moveTo(x, y)
            .lineTo(x, y + height)
            .stroke();
    }

    doc
        .lineWidth(.5)
        .moveTo(x + width, y)
        .lineTo(x + width, y + height)
        .stroke();


    doc.fontSize(10).fillColor('#292929');
}

exports.createInvoiceTableFunc = async (doc, mainTable, reportedItemsTable, duplicateTable, nonChargeables, adjustmentFeeTable, totalRemittance, non_chargeablesArr,
    worker, associateFees, supervisies, duplicateItems, tablesToShow, showAdjustmentFeeTable, associateFeeAssessmentTable, reportType,
    associateFeeBaseRateTablesCBT, associateFeeAssessmentTableCBT, associateFeeBaseRateTablesCPRI, associateFeeAssessmentTableCPRI) => {
    try {
        // the magic
        this.generateHeader(doc, worker)
        this.generateLine(doc, 70)
        await doc.table(mainTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });

        doc.moveDown()
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        reportedItemsTable.datas.map(x => {
            x.event_service_item_total = this.formatter.format(x.event_service_item_total)
            x.totalAmt = this.formatter.format(x.totalAmt)
        }
        )
        await doc.table(reportedItemsTable, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
                // non_chargeablesArr.find(x => x === row.service_name) && doc.addBackground(rectRow, 'pink', 0.15);
                // duplicateItems.find(x => x.service_name === row.service_name) && doc.addBackground(rectRow, 'pink', 0.15);
            },
        });

        let showduplicateTable = tablesToShow.map(x => x.duplicateTable)[0]
        showduplicateTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showduplicateTable && await doc.table(duplicateTable, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
                row && duplicateTable.datas.length !== 0 && doc.addBackground(rectRow, 'pink', 0.15);
            },
        });
        let showNonChargeablesTable = tablesToShow.map(x => x.nonChargeablesTable)[0]
        showNonChargeablesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showNonChargeablesTable && await doc.table(nonChargeables, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
                row && nonChargeables.datas.length !== 0 && doc.addBackground(rectRow, 'pink', 0.15);
            },
        });
        doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showAdjustmentFeeTable && await doc.table(adjustmentFeeTable, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });

        //*****************************Associate Fees Tables *****************************/
        let showassociateFeesTable = tablesToShow.map(x => x.associateFeesTable)[0]
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && doc
            .fontSize(20)
            .text('CFIR', { align: 'center' })
            .font('Helvetica-Bold')
        showassociateFeesTable && this.generateLine(doc, doc.y)
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }

        showassociateFeesTable && await doc.table(associateFees, {
            collapse: true,
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && await doc.table(associateFeeAssessmentTable, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        //******************************CBT********************************/
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && doc
            .fontSize(20)
            .text('CBT', { align: 'center' })
            .font('Helvetica-Bold')
        showassociateFeesTable && this.generateLine(doc, doc.y)
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }

        showassociateFeesTable && await doc.table(associateFeeBaseRateTablesCBT, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && await doc.table(associateFeeAssessmentTableCBT, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        //******************************CPRI********************************/
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && doc
            .fontSize(20)
            .text('CPRI', { align: 'center' })
            .font('Helvetica-Bold')
        showassociateFeesTable && this.generateLine(doc, doc.y)
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }

        showassociateFeesTable && await doc.table(associateFeeBaseRateTablesCPRI, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        showassociateFeesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showassociateFeesTable && await doc.table(associateFeeAssessmentTableCPRI, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });

        //*****************************End*****************************/


        let showTotalRemittanceTable = tablesToShow.map(x => x.totalRemittenceTable)[0]
        showTotalRemittanceTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showTotalRemittanceTable && await doc.table(totalRemittance, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
                indexColumn === 1 && doc.addBackground(rectCell, 'red', 0.15);
            },
        });

        reportType !== 'singlepdf' && doc.moveDown();
        reportType !== 'singlepdf' && await supervisies.forEach(async (t) => {
            if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
            t.rows.map(x => x[5] = this.formatter.format(x[5]))
            await doc.table(t, {
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    virticalLines(doc, rectCell, indexColumn)
                    doc.font("Helvetica").fontSize(8);
                    non_chargeablesArr.find(x => x === row.service_name) && doc.addBackground(rectRow, 'pink', 0.15);
                },
            });
        })

    } catch (error) {
        console.log(error, 'Error At: Create Invoice Table Function')
    }
    // done!
    this.addNumberTotPages(doc)
    this.addDateToPages(doc)

    doc.end();
}

exports.createPaymentTableFunc = async (doc, worker, non_remittableItems, appliedPaymentTable, totalAppliedPaymentsTable, nonRemittablesTable, transactionsTable, superviseeClientPaymentsTable,
    adjustmentFeeTable, showAdjustmentFeeTable, l1SupPrac, reportType, tablesToShow) => {
    let nonRemittables = non_remittableItems.map(x => x.name)
    try {
        this.generatePaymentHeader(doc, worker)
        this.generateLine(doc, 70)

        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        appliedPaymentTable.datas.map(x => x.applied_amt = this.formatter.format(x.applied_amt))
        await doc.table(appliedPaymentTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8)
                nonRemittables.includes(row.case_program) && appliedPaymentTable.datas.length !== 0 && doc.addBackground(rectRow, 'pink', 0.15);
            },
        });
        let showNonRemittablesTable = tablesToShow.map(x => x.nonRemittablesTable)[0]
        showNonRemittablesTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showNonRemittablesTable && nonRemittablesTable.datas.map(x => x.applied_amtTemp = this.formatter.format(x.applied_amt))
        showNonRemittablesTable && await doc.table(nonRemittablesTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                indexColumn === 0 && doc.addBackground(rectCell, 'red', 0.15)
                indexColumn === 2 && doc.addBackground(rectCell, 'red', 0.15)
                doc.font("Helvetica").fontSize(8);
            },
        });

        let showTransactions = tablesToShow.map(x => x.transactionsTable)[0]
        showTransactions && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showTransactions && transactionsTable.datas.map(x => x.cost = this.formatter.format(x.cost))
        showTransactions && transactionsTable.datas.map(x => x.sum = this.formatter.format(x.sum))
        showTransactions && await doc.table(transactionsTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        let showsuperviseeTotalTabel = tablesToShow.map(x => x.superviseeTotalTabel)[0]
        showsuperviseeTotalTabel && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showsuperviseeTotalTabel && superviseeClientPaymentsTable.datas.map(x => x.total = this.formatter.format(x.total))
        showsuperviseeTotalTabel && superviseeClientPaymentsTable.datas.map(x => x.applied_amt = this.formatter.format(x.applied_amt))
        showsuperviseeTotalTabel && await doc.table(superviseeClientPaymentsTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
                nonRemittables.includes(row.description) && doc.addBackground(rectRow, 'pink', 0.15);
            },
        });
        doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showAdjustmentFeeTable && await doc.table(adjustmentFeeTable, {
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                doc.font("Helvetica").fontSize(8);
            },
        });
        doc.moveDown()

        reportType !== 'singlepdf' && l1SupPrac[0]?.datas?.length && await l1SupPrac.map(async (t) => {
            if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
            await doc.table(t, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    virticalLines(doc, rectCell, indexColumn)
                    doc.font("Helvetica").fontSize(8);
                },
            });
        })
        let showappliedPaymentsTotalTable = tablesToShow.map(x => x.appliedPaymentsTotalTable)[0]
        showappliedPaymentsTotalTable && doc.moveDown();
        if (doc.y > 0.79 * doc.page.height) { doc.addPage() }
        showappliedPaymentsTotalTable && await doc.table(totalAppliedPaymentsTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                virticalLines(doc, rectCell, indexColumn)
                indexColumn === 4 && doc.addBackground(rectCell, 'red', 0.15);
                doc.font("Helvetica").fontSize(8);
            },
        });
    } catch (error) {
        console.log(error, 'error in creating payment pdf')
    }
    this.addNumberTotPages(doc)
    this.addDateToPages(doc)

    // done!
    doc.end();
}

exports.formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});



exports.removeNullStr = (arr, funderName) => {
    arr.map((obj, i) => {
        Object.keys(obj).forEach((key) => {
            if (obj[key] === null) {
                obj[key] = funderName;
            }
        })
    });
    return arr
}
exports.removeNaN = (arr) => {
    return arr.filter(Boolean)
}

exports.sortByDateAndName = (arr) => {
    return arr.sort(
        firstBy(function (a, b) { return new Date(a.batch_date) - new Date(b.batch_date) })
            .thenBy((a, b) => { return a.worker.localeCompare(b.worker); })
    );
}
exports.sortByDateAndEvent_primary_worker_name = (arr) => {
    return arr.sort(
        firstBy(function (a, b) { return new Date(a.batch_date) - new Date(b.batch_date) })
            .thenBy((a, b) => { return a.event_primary_worker_name.localeCompare(b.event_primary_worker_name); })
    );
}
exports.sortByName = (arr) => {
    return arr.sort(
        function (a, b) { return a.worker.localeCompare(b.worker); }
    );
}


exports.sortByDate = (arr) => {
    return arr.sort(
        firstBy(function (a, b) { return new Date(a.batch_date) - new Date(b.batch_date) })
            .thenBy((a, b) => { return a.individual_name.localeCompare(b.individual_name); })
    );
}
exports.sortByJustDate = (arr) => {
    return arr.sort(function (a, b) {
        return new Date(a.batch_date) - new Date(b.batch_date)
    });
    // return arr.sort(
    //     new Date(a.batch_date) - new Date(b.batch_date)
    // );
}

exports.addNumberTotPages = (doc) => {
    //Global Edits to All Pages (Header/Footer, etc)
    let pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        //Footer: Add page number
        let oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0
        doc
            .text(
                `Page: ${i + 1} of ${pages.count}`,
                0,
                doc.page.height - (oldBottomMargin / 2), // Centered vertically in bottom margin
                { align: 'center' }
            );
        doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
    }
}
exports.addDateToPages = (doc) => {
    //Global Edits to All Pages (Header/Footer, etc)
    let pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        //Footer: Add page number
        let oldBottomMargin = doc.page.margins.top;
        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        // doc.page.margins.top = 10
        doc
            .text(
                `Date: ${month + '/' + day + "/" + year}`,
                0,
                10, // Centered vertically in bottom margin
                { align: 'right' }
            );
        doc.page.margins.top = oldBottomMargin; // ReProtect bottom margin
    }
}

// exports.removeSupPrac = async (arr, worker) => {
//     let superviseies = await getSuperviseeies(worker)
//     let mapedSupervisees = (superviseies.map(x => x.associateName = String(x.associateName.split(",")[1] + " " + x.associateName.split(",")[0]).trim()))
//     let removedArr = arr.filter(x => mapedSupervisees.includes(x.worker))
//     return removedArr
// }

exports.getUniqueItemsMultiKey = (arr, keyProps) => {
    const kvArray = arr.map(entry => {
        const key = keyProps.map(k => entry[k]).join('|');
        return [key, entry];
    });
    const map = new Map(kvArray);
    return Array.from(map.values());
}
exports.getFeeAmount = (arr, type) => {
    if (type === undefined) { return { name: '', percentage: '0.0%', ammount: '$0.00' } }
    return arr.find(i => type === i.name) === undefined ? { name: '', percentage: '0.0%', ammount: '$0.00' } : arr.find(i => type === i.name)
    // return arr.find(i => type === i.name) !== undefined && arr.find(i => type === i.name)
}

exports.calculateProccessingFee = (workerPaymentData, proccessingFeeTypes) => {
    // let tempArr = this.removeOrAddAssessments(workerPaymentData, false)
    return workerPaymentData.map(x => x.proccessingFee =
        parseFloat(this.getFeeAmount(proccessingFeeTypes, x.reason_type) && this.getFeeAmount(proccessingFeeTypes, x.reason_type).ammount.replace(/[^0-9]+/, '')) +
        parseFloat(this.getFeeAmount(proccessingFeeTypes, x.reason_type) && this.getFeeAmount(proccessingFeeTypes, x.reason_type).percentage.replace(/[^0-9.]+/, '') / 100) * x.total_amt)
}

exports.removeOrAddAssessments = (paymentData, assessments) => {
    return assessments ?
        paymentData.filter(x => x.case_program.startsWith('A__') || x.case_program.startsWith('aa_'))
        : paymentData.filter(x => !x.case_program.startsWith('A__') || !x.case_program.startsWith('aa_')
            && !(x.case_program.startsWith('A_c_') || !x.case_program.startsWith('T_c_')
                || !x.case_program.startsWith('A_f_') || !x.case_program.startsWith('T_f_')))
}
exports.calculateWorkerFeeByLeval = (wokrerLeval, data, paymentData, assessments, isSuperviser, isSupervised, IsSupervisedByNonDirector) => {
    if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && !isSupervised && !isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A__') || x.service_name.startsWith('aa_'))
            : data.filter(x => !x.service_name.startsWith('A__') || !x.service_name.startsWith('aa_')
                && (!x.service_name.startsWith('A_c_') || !x.service_name.startsWith('T_c_')
                    || !x.service_name.startsWith('A_f_') || !x.service_name.startsWith('T_f_')))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && IsSupervisedByNonDirector) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A__') || x.service_name.startsWith('aa_'))
            : data.filter(x => !x.service_name.startsWith('A__') || !x.service_name.startsWith('aa_')
                && !(x.service_name.startsWith('A_c_') || !x.service_name.startsWith('T_c_')
                    || !x.service_name.startsWith('A_f_') || !x.service_name.startsWith('T_f_')))
        // paymentData.filter(x => x.case_program.startsWith('A__'))
        // : paymentData.filter(x => x.case_program.startsWith('T__'))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && !IsSupervisedByNonDirector) {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A__'))
            : paymentData.filter(x => x.case_program.startsWith('T__'))
    }
    else if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A__') || x.service_name.startsWith('aa_'))
            : data.filter(x => !x.service_name.startsWith('A__') || !x.service_name.startsWith('aa_')
                && !(x.service_name.startsWith('A_c_') || !x.service_name.startsWith('T_c_')
                    || !x.service_name.startsWith('A_f_') || !x.service_name.startsWith('T_f_')))
    }
    else if (wokrerLeval === 'L1 (Sup Prac)') {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A__'))
            : paymentData.filter(x => x.case_program.startsWith('T__'))
    }
    else {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_') || x.service_name.startsWith('aa_'))
            : data.filter(x => !x.service_name.startsWith('A_') || !x.service_name.startsWith('aa_')
                && !(x.service_name.startsWith('A_c_') || !x.service_name.startsWith('T_c_')
                    || !x.service_name.startsWith('A_f_') || !x.service_name.startsWith('T_f_')))
    }
}

//********************************************** */
exports.removeOrAddAssessmentsCBT = (paymentData, assessments) => {
    return assessments ?
        paymentData.filter(x => x.case_program.startsWith('A_c_'))
        : paymentData.filter(x => x.case_program.startsWith('T_c_'))
}


exports.calculateWorkerFeeByLevalCBT = (wokrerLeval, data, paymentData, assessments, isSuperviser, isSupervised, IsSupervisedByNonDirector) => {
    if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && !isSupervised && !isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_c_'))
            : data.filter(x => x.service_name.startsWith('T_c_'))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && !IsSupervisedByNonDirector) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_c_'))
            : data.filter(x => x.service_name.startsWith('T_c_'))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && IsSupervisedByNonDirector) {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A_c_'))
            : paymentData.filter(x => x.case_program.startsWith('T_c_'))
    }
    else if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_c_'))
            : data.filter(x => x.service_name.startsWith('T_c_'))
    }
    else if (wokrerLeval === 'L1 (Sup Prac)') {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A_c_'))
            : paymentData.filter(x => x.case_program.startsWith('T_c_'))
    }
    else {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_c_'))
            : data.filter(x => x.service_name.startsWith('T_c_'))
    }
}

//********************************** */
exports.removeOrCPRI = (paymentData, assessments) => {
    return assessments ?
        paymentData.filter(x => x.case_program.startsWith('A_f_'))
        : paymentData.filter(x => x.case_program.startsWith('T_f_'))
}
exports.calculateWorkerFeeByLevalCPRI = (wokrerLeval, data, paymentData, assessments, isSuperviser, isSupervised, IsSupervisedByNonDirector) => {
    if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && !isSupervised && !isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_f_'))
            : data.filter(x => x.service_name.startsWith('T_f_'))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && !IsSupervisedByNonDirector) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_f_'))
            : data.filter(x => x.service_name.startsWith('T_f_'))
    }
    else if ((wokrerLeval === 'L3' || wokrerLeval === 'L4') && IsSupervisedByNonDirector) {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A_f_'))
            : paymentData.filter(x => x.case_program.startsWith('T_f_'))
    }
    else if ((wokrerLeval === 'L1' || wokrerLeval === 'L2') && isSuperviser) {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_f_'))
            : data.filter(x => x.service_name.startsWith('T_f_'))
    }
    else if (wokrerLeval === 'L1 (Sup Prac)') {
        return assessments ?
            paymentData.filter(x => x.case_program.startsWith('A_f_'))
            : paymentData.filter(x => x.case_program.startsWith('T_f_'))
    }
    else {
        return assessments ?
            data.filter(x => x.service_name.startsWith('A_f_'))
            : data.filter(x => x.service_name.startsWith('T_f_'))
    }
}

exports.getProfileDateFormatted = async (workerId) => {
    let profileDates = await getProfileDates(workerId)
    profileDates.startDate = moment(profileDates.startDate).format('YYYY-MM-DD')
    profileDates.endDate = moment(profileDates.endDate).format('YYYY-MM-DD')
    return profileDates
}
exports.findDuplicates = (arr) => {
    let duplicates = [];
    let unique = arr.filter(function (item) {
        let duplicate = arr.filter(function (item2) {
            return item.individual_name === item2.individual_name &&
                item.case_file_name === item2.case_file_name &&
                item.batch_date === item2.batch_date &&
                item.event_id === item2.event_id &&
                item.invoice_id === item2.invoice_id &&
                item.event_service_item_name === item2.event_service_item_name;
        });
        if (duplicate.length > 1) {
            duplicates.push(item);
            return false;
        }
        return true;
    });
    return duplicates;

    // const seen = new Set();
    // const duplicates = [];
    // arr.forEach(item => {
    //     const itemAsString = JSON.stringify(item);
    //     if (seen.has(itemAsString)) {
    //         duplicates.push(item);
    //     } else {
    //         seen.add(itemAsString);
    //     }
    // });
    // return duplicates;

}

exports.findSplitFees = (arr) => {
    return arr.filter(item => {
        let match = false;
        arr.forEach(compareItem => {
            if (item.event_id === compareItem.event_id && item.case_file_name === compareItem.case_file_name
                && item.service_name === compareItem.service_name && item.batch_date === compareItem.batch_date && item.invoice_id !== compareItem.invoice_id) {
                match = true;
            }
        });
        return match;
    });

}

exports.removeSplitFees = (arr) => {
    let match = false;
    arr.forEach((item, index) => {
        arr.forEach((compareItem, compareIndex) => {
            if (item.event_id === compareItem.event_id && item.case_file_name === compareItem.case_file_name
                && item.service_name === compareItem.service_name && item.batch_date === compareItem.batch_date && item.invoice_id !== compareItem.invoice_id) {
                if (!match) {
                    match = true;
                } else {
                    arr.splice(compareIndex, 1);
                }
            }
        });
    });
    return arr;

}

exports.removeDuplicates = (arr) => {
    let seen = new Set();
    let unique = arr.filter(function (item) {
        let key = item.individual_name + item.case_file_name + item.batch_date + item.event_id + item.invoice_id + item.event_service_item_name;
        if (!seen.has(key)) {
            seen.add(key);
            return true;
        }
        return false;
    });
    return unique;
}

exports.getSummarizedData = (data) => {
    const summarizedData = data.reduce((acc, item) => {
        const key = `${item.reason_type}-${item.applied_amt}`;
        if (!acc[key]) {
            acc[key] = {
                superviser: item.superviser,
                worker: item.worker,
                reason_type: item.reason_type,
                cost: item.applied_amt,
                quantity: 0,
                sum: 0
            };
        }
        acc[key].quantity += 1;
        acc[key].sum += item.applied_amt;
        return acc;
    }, {});
    return summarizedData

}
exports.getSummarizedSuperviseeData = (arr) => {
    return arr.reduce((acc, curr) => {
        let group = acc.find(g => g.description === curr.description && g.applied_amt === curr.applied_amt);
        if (!group) {
            group = {
                worker: curr.worker,
                description: curr.description,
                applied_amt: curr.applied_amt,
                qty: 0,
                total: 0,
            };
            acc.push(group);
        }
        group.qty++;
        group.total += curr.applied_amt;
        return acc;
    }, []);

}

exports.calculateProcessingFeeTemp = (reasonTypeArray, costArray) => {
    let arr = []
    costArray.forEach(costObj => {
        let matchingFee = reasonTypeArray.find(fee => fee.name === costObj.reason_type);
        if (matchingFee) {
            let percentage = parseFloat(matchingFee.percentage) / 100;
            let amount = parseFloat(matchingFee.ammount.replace("$", ""));
            arr.push(
                {
                    worker: costObj.worker,
                    reason_type: costObj.reason_type,
                    sum: costObj.sum,
                    amount: amount,
                    percentage: percentage,
                    qty: costObj.quantity,
                    proccessingFee: (costObj.sum * percentage) + (amount * costObj.quantity)
                })
        }
    });
    return arr
}