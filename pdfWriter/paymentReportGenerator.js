const { createPaymentReportTable } = require("./PaymentReport");

exports.paymentReportGenerator = (res, date, users, emailPassword, action, reportType) => {
    users.map(async (worker) => {
        return createPaymentReportTable(res, date, worker.associateName, worker.id, worker.associateEmail, emailPassword, action, reportType).then(async (resp) => {
            if (resp === 404) {
                res.writeHead(404)
                res.send()
                return;
            }
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(resp.pdfData),
                'Content-Type': 'application/pdf',
                'Content-disposition': `attachment;filename=file.pdf`,
            }).end(resp.pdfData);
        }).catch(err => {
            console.log(err)
            res.sendStatus(500)
            throw (err)
        })
    })

}