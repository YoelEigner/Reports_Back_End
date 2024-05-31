var CryptoJS = require("crypto-js");
const fs = require('fs');
const { createInvoiceTable } = require('./InvoiceReport');
const archiver = require("archiver");
const { getEmailPassword } = require("../sql/sql");
const { createPaymentReportTable } = require("./PaymentReport");
const { InvoicePromiseGenerator } = require("./invoiceReportGenerator");
const { paymentReportGenerator } = require("./paymentReportGenerator");
const { PDFTYPE, ACTIONTYPE } = require('../pdfWriter/commonEnums.js');
const { summeryReportGenerator } = require("./summarizedReports/summeryReportGenerator.js");

const getDecryptedPass = async () => {
    try {
        let encryptedPass = await getEmailPassword()
        const result = CryptoJS.AES.decrypt(encryptedPass[0].password, process.env.KEY);
        return result.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return ''
    }

}

const getNetTotal = (res, date, worker, action, reportType) => {
    return createPaymentReportTable(res, date, worker.associateName, worker.id, '', '', action, reportType)
}

exports.reports = async (res, date, users, action, videoFee, reportType, actionType, sites) => {
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

    if (reportType === PDFTYPE.SUMMERY) {
        summeryReportGenerator(res, date, action, sites, actionType)
    }
    if (actionType === ACTIONTYPE.PAYMENT && reportType === PDFTYPE.SINGLEPDF) {
        paymentReportGenerator(res, date, users, emailPassword, action, reportType)
    }
    if (actionType === ACTIONTYPE.INVOICE && reportType === PDFTYPE.SINGLEPDF) {
        let paymentData = await getNetTotal(res, date, users[0], action, reportType)
        InvoicePromiseGenerator(res, date, users, paymentData.netAppliedTotal, reportType, paymentData.duration_hrs, videoFee, paymentData.qty, paymentData.proccessingFee)
    }
    if (reportType === PDFTYPE.MULTIPDF) {
        let filesAppended = 0;
        let promise = users.map(async (worker, index) => {
            if (actionType === ACTIONTYPE.PAYMENT) {
                return createPaymentReportTable(res, date, worker.associateName, worker.id, worker.associateEmail, emailPassword, action, reportType, index).then(async (resp) => {
                    if (resp === 404) {
                        return null;
                    }
                    if (resp !== 200) {
                        archive.append(resp.pdfData, { name: worker.associateName + '_Payment.pdf' })
                        filesAppended = filesAppended + 1;
                    }
                    else {
                        // return 500
                    }
                }).catch(err => {
                    console.log(err, 'Multi Payment report error')
                    return err
                })
            }
            else if (actionType === ACTIONTYPE.INVOICE) {
                let paymentData = await getNetTotal(res, date, worker, videoFee, action)
                if (paymentData === 404) {
                    return null
                }
                return createInvoiceTable(res, date, worker.associateName, worker.id, paymentData.netAppliedTotal, paymentData.duration_hrs, videoFee,
                    paymentData.qty, paymentData.proccessingFee, action, worker.associateEmail, emailPassword, reportType, index).then(async (invoicePDF) => {
                        if (invoicePDF === 404) {
                            return null;
                        }
                        if (invoicePDF !== 200) {
                            archive.append(invoicePDF, { name: worker.associateName + '_Invoice.pdf' })
                            filesAppended = filesAppended + 1;
                        }
                        else {
                            // return 500
                            // console.log('invoicePDF', invoicePDF)
                        }
                    }).catch(err => {
                        console.log(err, 'Multi Invoice report error')
                        res.status(400).json(err);
                        return err
                    })

            }
        })
        Promise.all(promise).then(() => {
            if (filesAppended === 0) {
                if (!res.headersSent) {
                    res.writeHead(404);
                }
                res.end()
                return;
            }
            archive.pipe(output);
            archive.finalize();
        });
    }
}