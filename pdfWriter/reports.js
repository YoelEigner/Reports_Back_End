var CryptoJS = require("crypto-js");

const PDFDocument = require("pdfkit-table");
const fs = require('fs');
const { createZip } = require('../zipFiles/createZip');
const { createInvoiceTable } = require('./InvoiceReport');
const archiver = require("archiver");
const { getEmailPassword } = require("../sql/sql");
const { createPaymentReportTable } = require("./PaymentReport");
const { InvoicePromise, InvoicePromiseGenerator } = require("./invoiceReportGenerator");
const { paymentReportGenerator } = require("./paymentReportGenerator");


const getDecryptedPass = async () => {
    let encryptedPass = await getEmailPassword()
    const result = CryptoJS.AES.decrypt(encryptedPass[0].password, process.env.KEY);
    return result.toString(CryptoJS.enc.Utf8);
}

const getNetTotal = (res, date, worker, action, reportType) => {
    return createPaymentReportTable(res, date, worker.associateName, worker.id, '', '', action, reportType)
}

exports.reports = async (res, date, users, action, videoFee, reportType, actionType) => {
    let emailPassword = await getDecryptedPass()

    let archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    let output = fs.createWriteStream('report.zip');
    archive.on('error', function (err) {
        res.sendStatus(500)
    });
    output.on('finish', function () {
        res.download('report.zip');
    });
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            res.sendStatus(500)
        }
    });

    if (actionType === 'payment' && reportType === 'singlepdf') {
        paymentReportGenerator(res, date, users, emailPassword, action, reportType)
    }
    if (actionType === 'invoice' && reportType === 'singlepdf') {
        let invoice = await getNetTotal(res, date, users[0], action, reportType)
        InvoicePromiseGenerator(res, date, users, invoice.netAppliedTotal, reportType, invoice.duration_hrs, videoFee, invoice.qty, invoice.proccessingFee)
    }

    if (reportType === 'multipdf') {
        let promise = users.map(async (worker) => {
            if (actionType === 'payment') {
                return createPaymentReportTable(res, date, worker.associateName, worker.id, worker.associateEmail, emailPassword, action).then(async (resp) => {
                    if (resp !== 200) {
                        archive.append(resp.pdfData, { name: worker.associateName + '_Payment.pdf' })
                    }
                    else {
                        // console.log('resp', resp)
                    }
                }).catch(err => {
                    console.log(err)
                })
            }
            else if (actionType === 'invoice') {
                let invoice = await getNetTotal(res, date, worker, videoFee, action)
                return createInvoiceTable(res, date, worker.associateName, worker.id, invoice.netAppliedTotal, invoice.duration_hrs, videoFee, invoice.qty, invoice.proccessingFee, action, worker.associateEmail, emailPassword).then(async (invoicePDF) => {
                    if (invoicePDF !== 200) {
                        archive.append(invoicePDF, { name: worker.associateName + '_Invoice.pdf' })
                    }
                    else {
                        // console.log('invoicePDF', invoicePDF)
                    }
                }).catch(err => {
                    console.log(err)
                })

            }
        })
        Promise.all(promise).then(() => {
            archive.pipe(output)
            archive.finalize();
        });
    }
}