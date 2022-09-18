const { createInvoiceTable } = require("./pdfWriter_Table");

exports.InvoicePromiseGenerator = (res, date, users, netAppliedTotal, reportType,duration_hrs,videoFee) => {
    
    users.map(async (worker) => {
        return await createInvoiceTable(res, date, worker.associateName, worker.id, netAppliedTotal,duration_hrs,videoFee).then(async (invoicePDF) => {
            if (reportType === 'singlepdf' && actio) {
                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(invoicePDF),
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=file.pdf`
                }).end(invoicePDF);
            }
            // else if (action === 'email') {
            //     console.log(await getDecryptedPass())
            // }
        }).catch(err => {
            console.log(err)
        })
    });
}