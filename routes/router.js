const express = require("express");
const fs = require('fs');
const router = express.Router();
const { authMW, authToken } = require("../MidWear/MidWear");
const { createTable } = require("../pdfWriter/pdfWriter_Table");
const { getData, getphysicians, getProvinces, getWorkerProfile, insertWorkerProfile, getVideoTech, getServiceTypes, UpdateServiceTypes, UpdateWorkerPreofile, getPaymentTypes, getserviceTypes, getAssociateTypes, getSupervisies, getAssociateLeval, updateEmailPassword, resetAdjustmentFees } = require("../sql/sql");
const { createReport, filterSupervisies, getSupervisiesFunc } = require("../pdfWriter/pdfKitFunctions");
const { json } = require("express");
const { MultiPDF, GeneratePDF } = require("../pdfWriter/generatePDF");

//middlewaer
router.use(authToken)

//****************GET******************

router.route("/physicians", authToken).get(async (req, res) => {
    let resp = await getphysicians()
    res.send(resp)
});

router.route("/provinces", authToken).get(async (req, res) => {
    let resp = await getProvinces()
    res.json(resp)
})

router.route("/videotech", authToken).get(async (req, res) => {
    let resp = await getVideoTech()
    res.json(resp)
})
router.route("/servicetypes", authToken).get(async (req, res) => {
    let resp = await getServiceTypes()
    res.json(resp)
})
router.route("/paymenttypes", authToken).get(async (req, res) => {
    let resp = await getPaymentTypes()
    res.json(resp)
})

router.route('/getassociateleval', authToken).get(async (req, res) => {
    let resp = await getAssociateLeval()
    res.json(resp)
})


//************POST***************

router.route("/resetadjustmentfee", authToken).get(async (req, res) => {
    let resp = await resetAdjustmentFees()
    res.sendStatus(resp)
});
router.route("/updateemailpassword", authToken).post(async (req, res) => {
    let resp = await updateEmailPassword(req.body.password)
    res.sendStatus(resp)
});

router.route("/generatepdf", authToken).post(async (req, res) => {
    let date = { start: req.body.start, end: req.body.end }
    GeneratePDF(res, date, req.body.users, req.body.action, req.body.videoFee, req.body.reportType, req.body.actionType)
});

router.route("/associatetypes", authToken).post(async (req, res) => {
    let resp = await getAssociateTypes(req.body.associateType)
    res.json(resp)
})

router.route("/supervisies", authToken).post(async (req, res) => {
    let resp = await getSupervisiesFunc(req.body.name)
    res.json(resp)
})

router.route("/workprofiles", authToken).post(async (req, res) => {
    let resp = await getWorkerProfile(req.body.id)
    res.json(resp)
})
router.route("/newworkprofiles", authToken).post(async (req, res) => {
    let resp = await insertWorkerProfile(req.body.arr)
    res.json(resp)
})

router.route("/updateservicetypes", authToken).post(async (req, res) => {
    let resp = await UpdateServiceTypes(req.body.arr, req.body.id, req.body.covrage)
    res.json(resp)
})
router.route("/updateworkerprofile", authToken).post(async (req, res) => {
    let resp = await UpdateWorkerPreofile(req.body.obj, req.body.id)
    res.json(resp)
})



module.exports = router;