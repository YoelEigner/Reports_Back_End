const PDFDocument = require("pdfkit-table");
const moment = require('moment');
const { getSummerizedPaymentData } = require("../../sql/sql");
const { createSummertizedPaymentReport, getSummarizedDataByReasonType, getSummarizedDataByReasonTypeAndWorker } = require("../pdfKitFunctions");
const { summarizedTransactionTable } = require("../../tables/summarizedTransactionTable");


exports.paymentSummeryReport = (res, dateUnformatted, action, sites) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let doc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    reject(403)
                }
                else { resolve({ pdfData }) }
            } catch (error) {
                res.writeHead(500)
            }
        });

        try {
            const summarizedTransactionTableData = [];
            for (const site of sites) {
                let date = { start: moment.utc(dateUnformatted.start).format('YYYY-MM-DD'), end: moment.utc(dateUnformatted.end).format('YYYY-MM-DD') }
                const paymentData = await getSummerizedPaymentData(date, site);
                const summarizedTransactionsByReasonType = Object.values(getSummarizedDataByReasonType(paymentData)).sort();
                summarizedTransactionTableData.push(summarizedTransactionTable(date, summarizedTransactionsByReasonType, `Payment type summary - ${site}`));
            }

            await createSummertizedPaymentReport(doc,
                summarizedTransactionTableData);
        } catch (error) {
            console.log("returnnewPromise ~ error:", error)
            reject(error)
            throw new Error(error);
        }
    })
}