const { createInvoiceTable } = require("./InvoiceReport");

exports.InvoicePromiseGenerator = (res, date, users, netAppliedTotal, reportType, duration_hrs, videoFee, qty, proccessingFee, action, associateEmail, emailPassword) => {

    users.map(async (worker) => {
        return await createInvoiceTable(res, date, worker.associateName, worker.id, netAppliedTotal, duration_hrs, videoFee, qty, proccessingFee, action, associateEmail, emailPassword, reportType).then(async (invoicePDF) => {
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(invoicePDF),
                'Content-Type': 'application/pdf',
                'Content-disposition': `attachment;filename=file.pdf`
            }).end(invoicePDF);
        }).catch(err => {
            console.log(err)
        })
    });
}