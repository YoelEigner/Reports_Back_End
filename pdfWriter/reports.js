const CryptoJS = require("crypto-js");
const fs = require('fs');
const { createInvoiceTable } = require('./InvoiceReport');
const archiver = require("archiver");
const { getEmailPassword } = require("../sql/sql");
const { createPaymentReportTable } = require("./PaymentReport");
const { InvoicePromiseGenerator } = require("./invoiceReportGenerator");
const { paymentReportGenerator } = require("./paymentReportGenerator");
const { PDFTYPE, ACTIONTYPE } = require('../pdfWriter/commonEnums.js');
const { summeryReportGenerator } = require("./summarizedReports/summeryReportGenerator.js");
const { sendProgressUpdate } = require("../sseManager.js");

let pLimit;
import('p-limit').then(module => {
    pLimit = module.default;
});

const getDecryptedPass = async () => {
    try {
        let encryptedPass = await getEmailPassword();
        const result = CryptoJS.AES.decrypt(encryptedPass[0].password, process.env.KEY);
        return result.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return '';
    }
};

const getNetTotal = (res, date, worker, action, reportType) => {
    return createPaymentReportTable(res, date, worker.associateName, worker.id, '', '', action, reportType);
};

const processWorker = async (res, date, worker, actionType, emailPassword, videoFee, archive, action) => {
    try {
        if (actionType === ACTIONTYPE.PAYMENT) {
            const resp = await createPaymentReportTable(
                res, date, worker.associateName, worker.id, worker.associateEmail,
                emailPassword, action, PDFTYPE.MULTIPDF
            );
            if (resp !== 404 && resp !== 200) {
                archive.append(resp.pdfData, { name: worker.associateName + '_Payment.pdf' });
                return 1;
            }
        } else if (actionType === ACTIONTYPE.INVOICE) {
            const paymentData = await getNetTotal(res, date, worker, ACTIONTYPE.INVOICE, PDFTYPE.MULTIPDF);
            if (paymentData === 404) return 0;  // Skip if not found
            const invoicePDF = await createInvoiceTable(
                res, date, worker.associateName, worker.id, paymentData.netAppliedTotal,
                paymentData.duration_hrs, videoFee, paymentData.qty, paymentData.proccessingFee,
                action, worker.associateEmail, emailPassword, PDFTYPE.MULTIPDF
            );
            if (invoicePDF !== 404 && invoicePDF !== 200) {
                archive.append(invoicePDF, { name: worker.associateName + '_Invoice.pdf' });
                return 1;
            }
        }
    } catch (err) {
        console.error(err, `Error processing ${actionType} report for worker ${worker.associateName}`);
        return 0;
    }
    return 0;
};

const processUsers = async (res, date, users, actionType, emailPassword, videoFee, archive, totalUsers, action) => {
    if (!pLimit) {
        throw new Error('p-limit module not loaded yet');
    }
    const limit = pLimit(40);

    let processedCount = 0;
    const tasks = users.map(worker => limit(async () => {
        const result = await processWorker(res, date, worker, actionType, emailPassword, videoFee, archive, action);
        processedCount++;
        sendProgressUpdate({ processed: processedCount, total: totalUsers });
        return result;
    }));

    const results = await Promise.all(tasks);
    return results.reduce((acc, val) => acc + val, 0); // Sum up the number of files appended
};

exports.reports = async (res, date, users, action, videoFee, reportType, actionType, sites) => {
    let emailPassword = await getDecryptedPass();
    let archive = archiver('zip', { zlib: { level: 9 } });
    let output = fs.createWriteStream('report.zip');

    archive.on('error', (err) => {
        res.sendStatus(500);
    });

    output.on('finish', () => {
        res.download('report.zip');
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            // Log warning
        } else {
            res.sendStatus(500);
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
        const totalUsers = users.length;

        try {
            const totalFilesAppended = await processUsers(res, date, users, actionType, emailPassword, videoFee, archive, totalUsers, action);

            if (totalFilesAppended === 0) {
                if (!res.headersSent) {
                    res.writeHead(404);
                }
                res.end();
                return;
            }

            archive.pipe(output);
            archive.finalize();
        } catch (err) {
            console.error('Error processing multi-user reports:', err);
            res.sendStatus(500);
        }
    }
};