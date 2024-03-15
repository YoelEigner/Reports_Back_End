const PDFDocument = require("pdfkit-table");
const moment = require('moment');
const { getSummerizedInvoiceData } = require("../../sql/sql");
const { getUniqueItemsMultiKey, createSummertizedInvoiceReport } = require("../pdfKitFunctions");
const { summarizedReportedItemsTable } = require("../../tables/summarizedReportedItemsTable");


exports.invoiceSummeryReport = (res, dateUnformatted, action, sites) => {
    return new Promise(async (resolve, reject) => {
        let buffers = [];
        let doc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { printing: 'highResolution', top: 50, bottom: 50, left: 50, right: 50 } });
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            let pdfData = Buffer.concat(buffers);
            try {
                if (action === 'email') {
                    reject("Cannot email summerized report")
                }
                else { resolve({ pdfData }) }
            } catch (error) {
                res.writeHead(500)
            }
        });

        try {
            const reportedItemDataFilteredData = [];
            for (const site of sites) {
                let date = { start: moment.utc(dateUnformatted.start).format('YYYY-MM-DD'), end: moment.utc(dateUnformatted.end).format('YYYY-MM-DD') }
                const data = await getSummerizedInvoiceData(date, site);
                let reportedItemDataFiltered = getUniqueItemsMultiKey(data, ['event_service_item_name', 'event_primary_worker_name'])
                reportedItemDataFiltered.map(x => {
                    x.qty = data.filter(i =>
                        (i.event_primary_worker_name === x.event_primary_worker_name)
                        &&
                        (i.event_service_item_name === x.event_service_item_name)
                    ).length
                })

                const summarizedTransactions = await summarizedReportedItemsTable(reportedItemDataFiltered, date, site);
                reportedItemDataFilteredData.push(summarizedTransactions);
            }

            await createSummertizedInvoiceReport(doc,
                reportedItemDataFilteredData);
        } catch (error) {
            console.log("returnnewPromise ~ error:", error)
            reject(error)
            throw new Error(error);
        }
    })
}