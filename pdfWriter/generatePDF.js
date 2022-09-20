var CryptoJS = require("crypto-js");
const PDFDocument = require("pdfkit-table");
const fs = require('fs');
const { createZip } = require('../zipFiles/createZip');
const { createTable } = require('./InvoiceReport');
const archiver = require("archiver");
const { getEmailPassword } = require("../sql/sql");
const {  reports } = require("./reports");
const { paymentReport } = require("./PaymentReport");



exports.GeneratePDF = async (res, date, users, action, videoFee, reportType, actionType) => {
    reports(res, date, users, action, videoFee, reportType, actionType)
}