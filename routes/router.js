const express = require("express");
const router = express.Router();
const { authToken } = require("../MidWear/MidWear");
const { getphysicians, getProvinces, getWorkerProfile, insertWorkerProfile, getVideoTech, getServiceTypes, UpdateServiceTypes, UpdateWorkerPreofile, getPaymentTypes, getAssociateTypes, getAssociateLeval, updateEmailPassword, resetAdjustmentFees, deleteprofile, getnewphysicians } = require("../sql/sql");
const { getSupervisiesFunc } = require("../pdfWriter/pdfKitFunctions");
const { GeneratePDF } = require("../pdfWriter/generatePDF");
const { invalidateCache } = require("../MidWear/InvalidateCache");

//middlewaer
router.use(invalidateCache)
router.use(authToken)

//****************GET******************

router.route("/physicians", authToken).get(async (req, res) => {
    let resp = await getphysicians()
    res.send(resp)
});

router.route("/newphysicians", authToken).get(async (req, res) => {
    let resp = await getnewphysicians()
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
router.route("/deleteprofile", authToken).post(async (req, res) => {
    let resp = await deleteprofile(req.body.id)
    res.sendStatus(resp)
});

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