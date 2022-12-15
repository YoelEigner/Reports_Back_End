const moment = require("moment");
const sql = require("mssql");
var CryptoJS = require("crypto-js");


const config = {
    user: "Node",
    password: process.env.DBPASS,
    server: "localhost\\SQLEXPRESS01",
    database: "CFIR",
    port: 1433,
    options: {
        trustedConnection: false,
        trustServerCertificate: true
    }
};

exports.getData = async () => {
    try {
        await sql.connect(config);
        // let resp = await sql.query(process.env.QUERY)
        let resp = await sql.query(`SELECT *, CONVERT(varchar, DATEFROMPARTS(Year, MONTH(Month + '1,1'), Day)
                                    ) AS date FROM invoice_data`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}

exports.getDataUser = async (user) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT *, CONVERT(varchar, DATEFROMPARTS(Year, MONTH(Month + '1,1'), Day) 
                                    ) AS date FROM invoice_data WHERE individual_name='${user}`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDate = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDateA__ = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'
                                    AND event_service_item_name LIKE 'A__%'`)

        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDateT_c_ = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'
                                    AND event_service_item_name LIKE 'T_c_%'`)

        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDateA_c_ = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'
                                    AND event_service_item_name LIKE 'A_c_%'`)

        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDateT_f_ = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'
                                    AND event_service_item_name LIKE 'T_f_%'`)

        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getDataDateA_f_ = async (date, worker, city) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, CONVERT(VARCHAR(10), DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) , 101) AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day)
                                    >='${date.start}' and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <='${date.end}' AND [event_primary_worker_name]='${worker}'
                                    AND event_service_item_name LIKE 'A_f_%'`)

        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}

exports.getAssociateTypes = async (associateType) => {
    let temp = ""
    let query = ""
    if (associateType === 'associateType') {
        temp = 'associateType'
        query = `SELECT * FROM [CFIR].[dbo].[profiles] WHERE associateType=associateType`
    }
    else if (associateType === 'supervisers') {
        temp = 'associateType'
        query = `SELECT * FROM [CFIR].[dbo].[profiles] WHERE isSuperviser='true'`
    }
    else {
        temp = `'${associateType}'`
        query = `SELECT * FROM [CFIR].[dbo].[profiles] WHERE associateType=${temp}`
    }
    try {
        await sql.connect(config);
        let resp = await sql.query(query)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getAssociateFeeBaseRate = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT [associateType], [isSupervised], [supervisor1], [supervisor2], [supervisorOneGetsMoney], [supervisorTwoGetsMoney] ,[associateFeeBaseRate],
                                    [associateFeeBaseRateOverrideLessThen],[associateFeeBaseRateOverrideGreaterThen],[associateFeeBaseRateTwo],
                                    [associateFeeBaseRateOverrideLessThenTwo],[associateFeeBaseRateOverrideGreaterThenTwo],[assessmentRate_c],
                                    [assessmentRate_f],
                                    [associateFeeBaseRate_c],
                                    [associateFeeBaseRate_f],
                                    [associateFeeBaseRateTwo_c],
                                    [associateFeeBaseRateTwo_f],
                                    [associateFeeBaseRateOverrideLessThen_c],
                                    [associateFeeBaseRateOverrideLessThen_f],
                                    [associateFeeBaseRateOverrideLessThenTwo_c],
                                    [associateFeeBaseRateOverrideLessThenTwo_f],
                                    [associateFeeBaseRateOverrideGreaterThen_c],
                                    [associateFeeBaseRateOverrideGreaterThen_f],
                                    [associateFeeBaseRateOverrideGreaterThenTwo_c],
                                    [associateFeeBaseRateOverrideGreaterThenTwo_f],
                                    [associateFeeBaseRateOverrideAsseements_c],
                                    [associateFeeBaseRateOverrideAsseements_f] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getAssociateLeval = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[associate_type]`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getAssociateVideoFee = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT [videoTechMonthlyFee] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getTablesToShow = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT [duplicateTable]
        ,[nonChargeablesTable]
        ,[associateFeesTable]
        ,[totalRemittenceTable]
        ,[nonRemittablesTable]
        ,[transactionsTable]
        ,[superviseeTotalTabel]
        ,[appliedPaymentsTotalTable] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getAssociateProfileById = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getAllSuperviseeProfiles = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[profiles] WHERE supervisorOneGetsMoney = 'true' or supervisorTwoGetsMoney = 'true'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}

exports.getphysicians = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT [id],[associateName],[status], [associateType] FROM [CFIR].[dbo].[profiles]`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getEmailPassword = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[email_password]`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}

exports.updateEmailPassword = async (password) => {
    const result = CryptoJS.AES.encrypt(password, process.env.KEY);
    try {
        await sql.connect(config);
        let resp = await sql.query(`UPDATE [dbo].[email_password] SET [password] = '${result.toString()}' WHERE id = 1`)
        return 200;
    } catch (err) {
        console.log(err); return 500
    }
}
exports.resetAdjustmentFees = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`UPDATE [dbo].[profiles] SET [adjustmentFee] = '${JSON.stringify([{ "name": "", "value": "0" }])}' ,
        [adjustmentPaymentFee] = '${JSON.stringify([{ "name": "", "value": "0" }])}' `)
        return 200;
    } catch (err) {
        console.log(err); return 500
    }
}

exports.getReportedItems = async (date, worker) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select [receipt_reason], [event_service_item_name],event_primary_worker_name, FORMAT(sum([event_service_item_total]), 'c') as TOTAL, sum([event_service_item_total]) as event_service_item_total,
                                    FORMAT([event_service_item_total], 'c') as itemTotal, COUNT([event_service_item_name]) as COUNT
                                    FROM [CFIR].[dbo].[invoice_data] WHERE DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) >= '${date.start}'
                                    and DATEFROMPARTS ( Year, MONTH(Month + '1,1'), Day) <= '${date.end}' AND [event_primary_worker_name]='${worker}'
                                    GROUP BY [event_service_item_name], event_service_item_total,event_primary_worker_name,[receipt_reason]`)
        return resp.recordset
    } catch (err) {
        console.log(err); return err
    }
}
exports.getReasonType = async (date, worker) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select worker, applied_amt, reason_type from financial_view WHERE DATEFROMPARTS ( Year1, MONTH(Month1 + '1,1'), Day1) >= '${date.start}'
                                    and DATEFROMPARTS ( Year1, MONTH(Month1 + '1,1'), Day1) <= '${date.end}' AND worker='${worker}'`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getProvinces = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[provinces]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getWorkerProfile = async (id) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[profiles] where id=${id}`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getVideoTech = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[video_technology]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getServiceTypes = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT *FROM [CFIR].[dbo].[service_files_names] `)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getPaymentTypes = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[payment_types] `)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getWorkerData = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[payment_types] `)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getProcessingFee = async (feeName) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[payment_types] where name ='${feeName}'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.UpdateServiceTypes = async (arr, id, covrage) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`UPDATE [CFIR].[dbo].[profiles] SET [${covrage}] = '${arr}' WHERE id=${id}`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getNonChargeables = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[non_chargeables]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getSupervisers = async (name) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName, associateType, supervisorOneGetsMoney, supervisorTwoGetsMoney FROM [CFIR].[dbo].[profiles] where
                                    (associateType != 'L1 (Sup Prac)') AND (supervisor1='${name}' OR supervisor2='${name}')`)

        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSupervisiesPaymentData = async (name) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[invoice_data] where event_primary_worker_name = '${name}'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.UpdateWorkerPreofile = async (arr, id) => {
    try {
        await sql.connect(config)
        await sql.query(`UPDATE [CFIR].[dbo].[profiles]
        SET status = '${arr.status}',
        startDate = '${arr.startDate}',
        site = '${arr.site}',
        associateType = '${arr.associateType}',
        associateEmail = '${arr.associateEmail}',
        associateName = '${arr.associateName}',
        isSuperviser = '${arr.isSuperviser}',
        isSupervised = '${arr.isSupervised}',
        IsSupervisedByNonDirector = '${arr.IsSupervisedByNonDirector}',
        supervisor1 = '${arr.supervisor1}',
        supervisor1Covrage = '${arr.supervisor1Covrage}',
        supervisor2 = '${arr.supervisor2}',
        supervisor2Covrage = '${arr.supervisor2Covrage}',
        supervisorOneGetsMoney = '${arr.supervisorOneGetsMoney}',
        supervisorTwoGetsMoney = '${arr.supervisorTwoGetsMoney}',
        chargesHST = '${arr.chargesHST}',
        associateFeeBaseType = '${arr.associateFeeBaseType}',
        associateFeeBaseType2 = '${arr.associateFeeBaseType2}',
        assessmentRate = '${arr.assessmentRate}',
        assessmentRate_c = '${arr.assessmentRate_c}',
        assessmentRate_f = '${arr.assessmentRate_f}',
        associateFeeBaseRate = '${arr.associateFeeBaseRate}',
        associateFeeBaseRate_c = '${arr.associateFeeBaseRate_c}',
        associateFeeBaseRate_f = '${arr.associateFeeBaseRate_f}',
        associateFeeBaseRateTwo = '${arr.associateFeeBaseRateTwo}',
        associateFeeBaseRateTwo_c= '${arr.associateFeeBaseRateTwo_c}',
        associateFeeBaseRateTwo_f = '${arr.associateFeeBaseRateTwo_f}',
        associateFeeBaseRateOverrideLessThen = '${arr.associateFeeBaseRateOverrideLessThen}',
        associateFeeBaseRateOverrideLessThen_c = '${arr.associateFeeBaseRateOverrideLessThen_c}',
        associateFeeBaseRateOverrideLessThen_f = '${arr.associateFeeBaseRateOverrideLessThen_f}',
        associateFeeBaseRateOverrideLessThenTwo = '${arr.associateFeeBaseRateOverrideLessThenTwo}',
        associateFeeBaseRateOverrideLessThenTwo_c = '${arr.associateFeeBaseRateOverrideLessThenTwo_c}',
        associateFeeBaseRateOverrideLessThenTwo_f = '${arr.associateFeeBaseRateOverrideLessThenTwo_f}',
        associateFeeBaseRateOverrideGreaterThen = '${arr.associateFeeBaseRateOverrideGreaterThen}',
        associateFeeBaseRateOverrideGreaterThen_c = '${arr.associateFeeBaseRateOverrideGreaterThen_c}',
        associateFeeBaseRateOverrideGreaterThen_f = '${arr.associateFeeBaseRateOverrideGreaterThen_f}',
        associateFeeBaseRateOverrideGreaterThenTwo = '${arr.associateFeeBaseRateOverrideGreaterThenTwo}',
        associateFeeBaseRateOverrideGreaterThenTwo_c = '${arr.associateFeeBaseRateOverrideGreaterThenTwo_c}',
        associateFeeBaseRateOverrideGreaterThenTwo_f = '${arr.associateFeeBaseRateOverrideGreaterThenTwo_f}',
        associateFeeBaseRateOverrideAsseements = '${arr.associateFeeBaseRateOverrideAsseements}',
        associateFeeBaseRateOverrideAsseements_c = '${arr.associateFeeBaseRateOverrideAsseements_c}',
        associateFeeBaseRateOverrideAsseements_f = '${arr.associateFeeBaseRateOverrideAsseements_f}',
        inOfficeBlocks = '${arr.inOfficeBlocks}',
        inOfficeBlockHours = '${arr.inOfficeBlockHours}',
        inOfficeBlockTimes = '${arr.inOfficeBlockTimes}',
        blocksBiWeeklyCharge = '${arr.blocksBiWeeklyCharge}',
        blocksHourlyRate = '${arr.blocksHourlyRate}',
        videoTech = '${arr.videoTech}',
        cahrgeVideoFee = '${arr.cahrgeVideoFee}',
        duplicateTable = '${arr.duplicateTable}',
        nonChargeablesTable = '${arr.nonChargeablesTable}',
        associateFeesTable = '${arr.associateFeesTable}',
        totalRemittenceTable = '${arr.totalRemittenceTable}',
        nonRemittablesTable = '${arr.nonRemittablesTable}',
        transactionsTable = '${arr.transactionsTable}',
        superviseeTotalTabel = '${arr.superviseeTotalTabel}',
        appliedPaymentsTotalTable = '${arr.appliedPaymentsTotalTable}',
        comments = '${arr.comments}',
        adjustmentFee = '${arr.adjustmentFee}',
        adjustmentPaymentFee = '${arr.adjustmentPaymentFee}'
        WHERE id = ${id}`)
        return 200
    } catch (error) {
        return {
            response: 500, errMsg: error.message
        }
    }
}

exports.insertWorkerProfile = async (arr) => {
    let date = moment(arr.startDate).format('YYYY-MM-DD')
    try {
        await sql.connect(config)
        let checkForDuplicate = await sql.query(`SELECT associateName from profiles WHERE associateName='${arr.associateName}' AND status=1`)
        if (checkForDuplicate.recordset.length === 0) {
            let resp = await sql.query(`INSERT INTO [CFIR].[dbo].[profiles] (
                status,
                startDate,
                site,
                associateType,
                associateEmail,
                associateName,
                isSuperviser,
                isSupervised,
                IsSupervisedByNonDirector,
                supervisor1,
                supervisor1Covrage,
                supervisor2,
                supervisor2Covrage,
                supervisorOneGetsMoney,
                supervisorTwoGetsMoney,
                chargesHST,
                assessmentRate,
                assessmentRate_c,
                assessmentRate_f,
                associateFeeBaseRate,
                associateFeeBaseRate_c,
                associateFeeBaseRate_f,
                associateFeeBaseRateTwo ,
                associateFeeBaseRateTwo_c,
                associateFeeBaseRateTwo_f,
                associateFeeBaseRateOverrideLessThen,
                associateFeeBaseRateOverrideLessThen_c,
                associateFeeBaseRateOverrideLessThen_f,
                associateFeeBaseRateOverrideLessThenTwo ,
                associateFeeBaseRateOverrideLessThenTwo_c,
                associateFeeBaseRateOverrideLessThenTwo_f,
                associateFeeBaseRateOverrideGreaterThen,
                associateFeeBaseRateOverrideGreaterThen_c,
                associateFeeBaseRateOverrideGreaterThen_f,
                associateFeeBaseRateOverrideGreaterThenTwo ,
                associateFeeBaseRateOverrideGreaterThenTwo_c ,
                associateFeeBaseRateOverrideGreaterThenTwo__f,
                associateFeeBaseRateOverrideAsseement,
                associateFeeBaseRateOverrideAsseements_c,
                associateFeeBaseRateOverrideAsseements_f,
                inOfficeBlocks,
                inOfficeBlockHours,
                inOfficeBlockTimes,
                blocksBiWeeklyCharge,
                blocksHourlyRate,
                videoTech,
                cahrgeVideoFee,
                duplicateTable,
                nonChargeablesTable,
                associateFeesTable,
                nonRemittablesTable,
                transactionsTable,
                superviseeTotalTabel,
                appliedPaymentsTotalTable,
                comments,
                adjustmentFee,
                adjustmentPaymentFee)
            VALUES (${arr.status === true ? 1 : 0}
                    ,'${date}' ,'${arr.site}' 
                    ,'${arr.associateType}'
                    ,'${arr.associateEmail}'
                    ,'${arr.associateName}'
                    ,${arr.isSuperviser === true ? 1 : 0}
                    ,${arr.isSupervised === true ? 1 : 0}
                    ,${arr.IsSupervisedByNonDirector === true ? 1 : 0}
                    ,'${arr.supervisor1}'
                    ,'${arr.supervisor1Covrage}'
                    ,'${arr.supervisor2}'
                    ,'${arr.supervisor2Covrage}'
                    ,${arr.supervisorOneGetsMoney === true ? 1 : 0}
                    ,${arr.supervisorTwoGetsMoney === true ? 1 : 0}
                    ,${arr.chargesHST === true ? 1 : 0},'${arr.assessmentRate}'
                    ,'${arr.associateFeeBaseType}'
                    ,'${arr.associateFeeBaseType2}',
                    '${arr.associateFeeBaseRate}'
                    '${arr.associateFeeBaseRate_c}'
                    '${arr.associateFeeBaseRate_f}'
                    ,'${arr.associateFeeBaseRateTwo}'
                    ,'${arr.associateFeeBaseRateTwo_c}'
                    ,'${arr.associateFeeBaseRateTwo_f}'
                    ,'${arr.associateFeeBaseRateOverrideLessThen}'
                    ,'${arr.associateFeeBaseRateOverrideLessThen_c}'
                    ,'${arr.associateFeeBaseRateOverrideLessThen_f}'
                    ,'${arr.associateFeeBaseRateOverrideLessThenTwo}'
                    ,'${arr.associateFeeBaseRateOverrideLessThenTwo_c}'
                    ,'${arr.associateFeeBaseRateOverrideLessThenTwo_f}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThen}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThen_c}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThen_f}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThenTwo}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThenTwo_c}'
                    ,'${arr.associateFeeBaseRateOverrideGreaterThenTwo_f}'
                    ,${arr.associateFeeBaseRateOverrideAsseements === true ? 1 : 0},
                    ,${arr.associateFeeBaseRateOverrideAsseements_c === true ? 1 : 0},
                    ,${arr.associateFeeBaseRateOverrideAsseements_f === true ? 1 : 0},
                    '${arr.inOfficeBlocks}'
                    ,'${arr.inOfficeBlockHours}'
                    ,'${arr.inOfficeBlockTimes}'
                    ,'${arr.blocksBiWeeklyCharge}'
                    ,'${arr.blocksHourlyRate}'
                    ,'${arr.videoTech}'
                    ,${arr.cahrgeVideoFee === true ? 1 : 0},
                    ${arr.duplicateTable === true ? 1 : 0}
                    ,${arr.nonChargeablesTable === true ? 1 : 0}
                    ,${arr.associateFeesTable === true ? 1 : 0}
                    ,${arr.nonRemittablesTable === true ? 1 : 0},
                    ${arr.transactionsTable === true ? 1 : 0}
                    ,${arr.superviseeTotalTabel === true ? 1 : 0}
                    ,${arr.appliedPaymentsTotalTable === true ? 1 : 0}
                    ,'${arr.comments}',
                    '${arr.adjustmentFee}','${arr.adjustmentPaymentFee}');SELECT SCOPE_IDENTITY() AS new_id;`
            )
            return { response: 200, new_id: resp.recordset[0] }
        }
        else {
            return {
                response: 500, errMsg: `User ${checkForDuplicate.recordset[0].associateName} 
            already exists, please set user to inactive before creating a new user with the same name` }
        }
    } catch (error) {
        console.log(error)
        return error
    }
}

//****************Payment querys**********************/
exports.getPaymentData = async (worker, date) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT *, CONVERT(VARCHAR(10), CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),101),101) AS FULLDATE from financial_view
                                    WHERE CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),111) BETWEEN '${date.start}' AND '${date.end}'
                                    AND (superviser like '%${worker}%' OR worker like '%${worker}%')`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getPaymentDataForWorker = async (tempWorker, date) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT *, CONVERT(VARCHAR(10), CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),101),101) AS FULLDATE from financial_view
                                    WHERE CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),111) BETWEEN '${date.start}' AND '${date.end}'
                                    AND worker like '%${tempWorker}%'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getSuperviseePaymentData = async (supervisee, date) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT *, CONVERT(VARCHAR(10), CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),101),101) AS FULLDATE from financial_view
                                    WHERE CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),111) BETWEEN '${date.start}' AND '${date.end}'
                                    AND (worker like '%${supervisee}%')`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSuperviseeies = async (superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[profiles] WHERE (supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 'true' AND associateType != 'L1 (Sup Prac)')
                                    or (supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true' AND associateType != 'L1 (Sup Prac)')`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSuperviseeiesL1 = async (superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] WHERE (supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 'true' AND associateType = 'L1 (Sup Prac)')
                                    or (supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true' AND associateType = 'L1 (Sup Prac)')`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getAllPayments = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM financial_view `)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getNonRemittables = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[non_remittable]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSubPrac = async (date, superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT *, CONVERT(VARCHAR(10), CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),101),101) AS FULLDATE from financial_view
                                    WHERE CONVERT(date, CONCAT(Year1,'/',Month1,'/',Day1),111) BETWEEN '${date.start}' AND '${date.end}'
                                    AND (worker like '%${superviser}%'AND associateType = 'L1 (Sub Prac)')`)

        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getWorkerId = async (partialName) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] where associateName like '%${partialName}%'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getAssessmentItemEquivalent = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[assessmentItemslookup]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}


exports.getAdjustmentsFees = async (worker, superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`select associateName, adjustmentPaymentFee from profiles WHERE associateName like '%${worker}%' 
                                    Or supervisor1 like '%${worker}%' or supervisor2 like '%${worker}%'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getAdjustmentsFeesWorkerOnly = async (worker, superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`select associateName, adjustmentPaymentFee from profiles WHERE associateName like '%${worker}%'`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

// exports.getSuperviserTwo = async (worker, superviser) => {
//     try {
//         await sql.connect(config)
//         let resp = await sql.query(`SELECT [status],[associateType],[associateName],[isSupervised],[supervisor2],[supervisorTwoGetsMoney]
//                                     FROM [CFIR].[dbo].[profiles]
//                                     WHERE (associateName = '${worker}') and (supervisor2='${superviser}' and isSupervised = 'true')`)
//         return resp.recordset
//     } catch (error) {
//         console.log(error)
//     }
// }


