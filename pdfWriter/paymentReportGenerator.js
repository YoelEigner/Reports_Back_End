const { createPaymentReportTable } = require("./PaymentReport");

exports.paymentReportGenerator = (res, date, users, emailPassword, action) => {
    users.map(async (worker) => {
        return createPaymentReportTable(res, date, worker.associateName, worker.id, worker.associateEmail, emailPassword, action).then(async (resp) => {
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(resp.pdfData),
                'Content-Type': 'application/pdf',
                'Content-disposition': `attachment;filename=file.pdf`,
            }).end(resp.pdfData);
        }).catch(err => {
            console.log(err)
        })
    })

}