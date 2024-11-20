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

// Utility function to split an array into chunks
const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

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
let chunkIndex = 0;
const processChunk = async (res, date, chunk, actionType, emailPassword, videoFee, archive, totalChunks, action) => {
    let filesAppended = 0;

    for (const worker of chunk) {
        try {
            if (actionType === ACTIONTYPE.PAYMENT) {
                const resp = await createPaymentReportTable(
                    res, date, worker.associateName, worker.id, worker.associateEmail,
                    emailPassword, action, PDFTYPE.MULTIPDF
                );
                if (resp === 404) continue; // Skip if not found
                if (resp !== 200) {
                    archive.append(resp.pdfData, { name: worker.associateName + '_Payment.pdf' });
                    filesAppended++;
                }
                sendProgressUpdate({ processed: chunkIndex, total: totalChunks });
                chunkIndex++;
            } else if (actionType === ACTIONTYPE.INVOICE) {
                const paymentData = await getNetTotal(res, date, worker, ACTIONTYPE.INVOICE, PDFTYPE.MULTIPDF);
                if (paymentData === 404) continue; // Skip if not found
                const invoicePDF = await createInvoiceTable(
                    res, date, worker.associateName, worker.id, paymentData.netAppliedTotal,
                    paymentData.duration_hrs, videoFee, paymentData.qty, paymentData.proccessingFee,
                    action, worker.associateEmail, emailPassword, PDFTYPE.MULTIPDF
                );
                if (invoicePDF === 404) continue; // Skip if not found
                if (invoicePDF !== 200) {
                    archive.append(invoicePDF, { name: worker.associateName + '_Invoice.pdf' });
                    filesAppended++;
                }
                sendProgressUpdate({ processed: chunkIndex, total: totalChunks });
                chunkIndex++;
            }
        } catch (err) {
            console.error(err, `Error processing ${actionType} report for worker ${worker.associateName}`);
            // Handle errors as needed
        }
    }

    return filesAppended;
};

exports.reports = async (res, date, users, action, videoFee, reportType, actionType, sites) => {
    let emailPassword = await getDecryptedPass();
    let archive = archiver('zip', { zlib: { level: 9 } }); // Compression level
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
            // Throw error
            res.sendStatus(500);
        }
    });

    // Handle different report types
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
        const chunkSize = 50; // Number of users to process at a time
        const userChunks = chunkArray(users, chunkSize);
        let totalFilesAppended = 0;

        try {
            for (const chunk of userChunks) {
                const filesAppended = await processChunk(res, date, chunk, actionType, emailPassword, videoFee, archive, users.length, action);
                totalFilesAppended += filesAppended;
            }

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