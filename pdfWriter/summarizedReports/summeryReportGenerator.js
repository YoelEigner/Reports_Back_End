const { ACTIONTYPE } = require("../commonEnums");
const { invoiceSummeryReport } = require("./invoiceSummeryReport");
const { paymentSummeryReport } = require("./paymentSummeryReport");

exports.summeryReportGenerator = async (res, date, action, sites, actionType) => {
    try {

        let pdfDataResponse = null;
        if (actionType === ACTIONTYPE.INVOICE) {
            pdfDataResponse = await invoiceSummeryReport(res, date, action, sites);
        }
        else if (actionType === ACTIONTYPE.PAYMENT) {
            pdfDataResponse = await paymentSummeryReport(res, date, action, sites);
        }
        else {
            res.sendStatus(404);
            return;
        }

        if (pdfDataResponse === 404) {
            res.writeHead(404)
            res.send()
            return;
        }

        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(pdfDataResponse.pdfData),
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment;filename=paymemtsummary.pdf',
        });

        res.write(pdfDataResponse.pdfData);
        res.end();
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}
