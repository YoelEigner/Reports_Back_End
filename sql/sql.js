const moment = require("moment");
const sql = require("mssql");
var CryptoJS = require("crypto-js");


const config = {
    user: "Node",
    password: process.env.DBPASS,
    server: "localhost\\SQLEXPRESS",
    database: "CFIR",
    port: 1433,
    options: {
        trustedConnection: false,
        trustServerCertificate: true,
        requestTimeout: 300000
    }
};

exports.getProfileDates = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select startDate, endDate from profiles where id = ${workerId}`)
        return resp.recordset[0];
    } catch (err) {
        console.log('profileDates Function', err); return err
        return err
    }
}

exports.deleteprofile = async (id) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`delete from profiles where id = ${id}`)
        if (resp.rowsAffected[0] === 1) return 200
        else return 500
    } catch (error) {
        console.log(error, 'Error deleing profile')
        return error
    }


}
exports.getInvoiceDataForWorker = async (date, worker, profileDates) => {
    try {
        await sql.connect(config);

        let resp = await sql.query(`select DISTINCT *, FORMAT([event_service_item_total], 'C') as TOTAL, batch_date AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE batch_date
                                    >='${date.start}' and batch_date <='${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name] like '%${worker}%' AND event_service_item_name NOT IN (SELECT name FROM non_remittable)`)
        return resp.recordset;
    } catch (err) {
        console.log('getDataDate Function', err);
        return err
    }
}
exports.getSuperviseeDataBySuperviser = async (date, worker, profileDates, superviser) => {
    try {
        await sql.connect(config);

        let resp = await sql.query(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, batch_date AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE batch_date
                                    >='${date.start}' and batch_date <='${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name] like '%${worker}%' AND [event_invoice_details_worker_name] like '%${superviser}%'
                                    AND event_service_item_name NOT IN (SELECT name FROM non_remittable)`)
        return resp.recordset;
    } catch (err) {
        console.log('getDataDate Function', err);
        return err
    }
}
exports.getInvoiceData = async (date, worker, profileDates) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`(SELECT DISTINCT i.*, FORMAT(i.[event_service_item_total], 'C') as TOTAL, i.batch_date AS FULLDATE
                                        FROM [CFIR].[dbo].[invoice_data] i
                                        JOIN profiles p ON (i.event_primary_worker_name = p.associateName OR event_invoice_details_worker_name = p.associateName) AND p.status = 1
                                        WHERE i.batch_date >= '${date.start}' AND i.batch_date <= '${date.end}'
                                        AND i.batch_date >= '${profileDates.startDate}' AND i.batch_date <= '${profileDates.endDate}'
                                        AND (i.event_primary_worker_name like '%${worker}%' OR i.event_invoice_details_worker_name like '%${worker}%')
                                        AND ((p.supervisor1 like '%${worker}%' AND p.supervisorOneGetsMoney = 1 OR assessmentMoneyToSupervisorOne = 1) 
                                        OR (p.supervisor2 like '%${worker}%' AND p.supervisorTwoGetsMoney = 1 OR assessmentMoneyToSupervisorTwo = 1))
                                        AND event_service_item_name NOT IN (SELECT name FROM non_remittable))
                                        UNION
                                        (
                                        select *, FORMAT([event_service_item_total], 'C') as TOTAL, batch_date AS FULLDATE
                                                                            FROM [CFIR].[dbo].[invoice_data] WHERE batch_date
                                                                            >='${date.start}' and batch_date <='${date.end}'
                                                                            AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                                                            AND [event_primary_worker_name] like '%${worker}%'
                                                                            AND event_service_item_name NOT IN (SELECT name FROM non_remittable))`
        )
        return resp.recordset;
    } catch (err) {
        console.log('getDataDate Function', err);
        return err
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
        console.log('getAssociateTypes FUnction', err); return err
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
                                    [associateFeeBaseRateOverrideAsseements_f],
                                    [assessmentMoneyToSupervisorOne],
                                    [assessmentMoneyToSupervisorTwo] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log('getAssociateFeeBaseRate Function', err); return err
    }
}
exports.getAssociateLeval = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[associate_type]`)
        return resp.recordset;
    } catch (err) {
        console.log('getAssociateLeval Function', err); return err
    }
}
exports.getAssociateVideoFee = async (workerId) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT [videoTechMonthlyFee] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        return resp.recordset;
    } catch (err) {
        console.log('getAssociateVideoFee Function', err); return err
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
        console.log('getTablesToShow Function', err); return err
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
        let resp = await sql.query(`SELECT [id],[associateName],[status], [startDate], [endDate], [associateType] FROM [CFIR].[dbo].[profiles]`)
        return resp.recordset;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getnewphysicians = async () => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[rpt_worker]`)
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
    // console.log(CryptoJS.AES.decrypt('U2FsdGVkX1+1PEm5EO+UWbzeep3WWO8Alg0eD48U4Hh9B0mtBZRughcKf3yHcrs/', process.env.KEY).toString(CryptoJS.enc.Utf8))
    // return 200;
    try {
        await sql.connect(config);
        let resp = await sql.query(`UPDATE [dbo].[email_password] SET [password] = '${result.toString()}' WHERE id = 1`)
        if (resp.rowsAffected[0] === 1) return 200
        else return 500
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

exports.getReportedItems = async (date, worker, profileDates, supervisor) => {
    try {
        await sql.connect(config);
        let resp = await sql.query(`select  [receipt_reason],[invoice_id], [service_name], [event_service_item_name],event_primary_worker_name, FORMAT(sum([event_service_item_total]), 'c') as TOTAL, sum([event_service_item_total]) as event_service_item_total,
                                    FORMAT([event_service_item_total], 'c') as itemTotal, COUNT([event_service_item_name]) as COUNT
                                    FROM [CFIR].[dbo].[invoice_data] 
                                    WHERE batch_date >= '${date.start}' and batch_date <= '${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name]='${worker}'
                                    AND event_invoice_details_worker_name like '${supervisor}'
                                    GROUP BY  [event_service_item_name], event_service_item_total,event_primary_worker_name,[receipt_reason],[service_name],[invoice_id]`)
        return resp.recordset
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
exports.getProbonoCases = async () => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT * FROM [CFIR].[dbo].[probono]`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getSupervisers = async (name) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney FROM [CFIR].[dbo].[profiles] where
                                      ((supervisor1='${name}' AND supervisorOneGetsMoney = 1 AND status =1)
                                      OR (supervisor2='${name}' AND supervisorTwoGetsMoney = 1 AND status =1))`)
        // let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney FROM [CFIR].[dbo].[profiles] where
        //                             (associateType != 'L1 (Sup Prac)') AND (supervisor1='${name}' AND supervisorOneGetsMoney = 'true' OR supervisor2='${name}' AND supervisorTwoGetsMoney = 'true')`)

        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSupervisersCFIR = async (name) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney, 
                                    assessmentMoneyToSupervisorOne, assessmentMoneyToSupervisorTwo 
                                    FROM [CFIR].[dbo].[profiles] where
                                    (supervisor1='${name}' AND (supervisorOneGetsMoney = 1 OR assessmentMoneyToSupervisorOne = 1 ) AND status =1 
                                    OR supervisor2='${name}' AND (supervisorTwoGetsMoney = 1 OR assessmentMoneyToSupervisorTwo = 1 )AND status =1)`)
        // let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney FROM [CFIR].[dbo].[profiles] where
        //                             (associateType != 'L1 (Sup Prac)') AND (supervisor1='${name}' AND supervisorOneGetsMoney = 'true' OR supervisor2='${name}' AND supervisorTwoGetsMoney = 'true')`)

        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}
exports.getSupervisersAssessments = async (name) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney, 
                                        assessmentMoneyToSupervisorOne,
                                        assessmentMoneyToSupervisorTwo FROM [CFIR].[dbo].[profiles] where
                                        (supervisor1='${name}' AND assessmentMoneyToSupervisorOne = 1)
                                        OR (supervisor2='${name}' AND assessmentMoneyToSupervisorTwo = 1)`)

        // let resp = await sql.query(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney FROM [CFIR].[dbo].[profiles] where
        //                             (associateType != 'L1 (Sup Prac)') AND (supervisor1='${name}' AND supervisorOneGetsMoney = 'true' OR supervisor2='${name}' AND supervisorTwoGetsMoney = 'true')`)

        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.UpdateWorkerPreofile = async (arr, id) => {
    try {
        await sql.connect(config)
        if (arr.associateName) {
            let checkForDuplicate = await sql.query(`SELECT startDate, endDate, status, associateName, associateType from profiles WHERE associateName='${arr.associateName}' AND id !=${id} AND status=1`)

            let duplicateFound = false;
            checkForDuplicate.recordset.forEach(record => {
                if (record.associateName === arr.associateName) {
                    if ((new Date(arr.startDate) >= record.startDate && new Date(arr.startDate) <= record.endDate) || (new Date(arr.endDate) >= record.startDate && new Date(arr.endDate) <= record.endDate)) {
                        duplicateFound = true;
                    }
                }
            });
            if (!duplicateFound) {
                await sql.query(`UPDATE [CFIR].[dbo].[profiles]
                        SET status = '${arr.status}',
                        startDate = '${arr.startDate}',
                        endDate = '${arr.endDate}',
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
                        assessmentMoneyToSupervisorOne = '${arr.assessmentMoneyToSupervisorOne}',
                        assessmentMoneyToSupervisorTwo = '${arr.assessmentMoneyToSupervisorTwo}',
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
                        adjustmentPaymentFee = '${arr.adjustmentPaymentFee}',
                        probono = ${arr.probono}
                        WHERE id = ${id}`)
                return 200

            } else {
                return {
                    response: 500, errMsg: `User ${arr.associateType} ${arr.associateName} 
                has another profile with overlapping dates, please check the dates and try again.` }
            }
        }
    } catch (error) {
        return {
            response: 500, errMsg: error.message
        }
    }
}

exports.insertWorkerProfile = async (arr) => {
    let date = moment.utc(arr.startDate).format('YYYY-MM-DD')
    let endDate = moment.utc(arr.endDate).format('YYYY-MM-DD')
    try {
        await sql.connect(config)
        let checkForOverlap = await sql.query(`SELECT * FROM profiles WHERE '${arr.startDate}' <= endDate AND '${arr.endDate}' >= startDate AND associateName='${arr.associateName}' AND associateType = '${arr.associateType}'`);
        if (checkForOverlap.recordset.length === 0) {
            let resp = await sql.query(`INSERT INTO [CFIR].[dbo].[profiles] (
                status,
                startDate,
                endDate,
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
                assessmentMoneyToSupervisorOne,
                assessmentMoneyToSupervisorTwo,
                chargesHST,
                associateFeeBaseType,
                associateFeeBaseType2,
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
                associateFeeBaseRateOverrideGreaterThenTwo_f,
                associateFeeBaseRateOverrideAsseements,
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
                totalRemittenceTable,
                nonRemittablesTable,
                transactionsTable,
                superviseeTotalTabel,
                appliedPaymentsTotalTable,
                comments,
                adjustmentFee,
                adjustmentPaymentFee,
                probono)
            VALUES (${arr.status === true ? 1 : 0}
                    ,'${date}'
                    ,'${endDate}'
                    ,'${arr.site}' 
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
                    ,${arr.assessmentMoneyToSupervisorOne === true ? 1 : 0}
                    ,${arr.assessmentMoneyToSupervisorTwo === true ? 1 : 0}
                    ,${arr.chargesHST === true ? 1 : 0}
                    ,'${arr.associateFeeBaseType}'
                    ,'${arr.associateFeeBaseType2}'
                    ,'${arr.assessmentRate}'
                    ,'${arr.assessmentRate_c}'
                    ,'${arr.assessmentRate_f}'
                    ,'${arr.associateFeeBaseRate}'
                    ,'${arr.associateFeeBaseRate_c}'
                    ,'${arr.associateFeeBaseRate_f}'
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
                    ,${arr.associateFeeBaseRateOverrideAsseements === true ? 1 : 0}
                    ,${arr.associateFeeBaseRateOverrideAsseements_c === true ? 1 : 0}
                    ,${arr.associateFeeBaseRateOverrideAsseements_f === true ? 1 : 0}
                    ,'${arr.inOfficeBlocks}'
                    ,'${arr.inOfficeBlockHours}'
                    ,'${arr.inOfficeBlockTimes}'
                    ,'${arr.blocksBiWeeklyCharge}'
                    ,'${arr.blocksHourlyRate}'
                    ,'${arr.videoTech}'
                    ,${arr.cahrgeVideoFee === true ? 1 : 0}
                    ,${arr.duplicateTable === true ? 1 : 0}
                    ,${arr.nonChargeablesTable === true ? 1 : 0}
                    ,${arr.associateFeesTable === true ? 1 : 0}
                    ,${arr.totalRemittenceTable === true ? 1 : 0}
                    ,${arr.nonRemittablesTable === true ? 1 : 0}
                    ,${arr.transactionsTable === true ? 1 : 0}
                    ,${arr.superviseeTotalTabel === true ? 1 : 0}
                    ,${arr.appliedPaymentsTotalTable === true ? 1 : 0}
                    ,'${arr.comments}'
                    ,'${arr.adjustmentFee}'
                    ,'${arr.adjustmentPaymentFee}'
                    ,${arr.probono});SELECT SCOPE_IDENTITY() AS new_id;`
            )
            return { response: 200, new_id: resp.recordset[0] }
        }
        else {
            return {
                response: 500, errMsg: `User ${arr.associateType} ${arr.associateName} 
            already exists, please change the profile dates before trying again` }
        }
    } catch (error) {
        console.log('insertWorkerProfile Function', error)
        return error
    }
}

//****************Payment querys**********************/
exports.getPaymentData = async (worker, date, profileDates) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`(SELECT fv.*, DATEFROMPARTS(fv.Year, fv.Month, fv.Day) AS FULLDATE 
                                        FROM financial_view fv
                                        JOIN profiles p ON (fv.superviser = p.associateName OR fv.worker = p.associateName) AND p.status = 1
                                        WHERE DATEFROMPARTS(fv.Year, fv.Month, fv.Day) BETWEEN '${date.start}' AND '${date.end}'
                                        AND Cast(fv.act_date as date) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                        AND (fv.superviser like '%${worker}%' OR worker like '%${worker}%')
                                        AND (
                                            (p.supervisor1 = fv.superviser AND p.supervisorOneGetsMoney = 1 AND LEFT(fv.case_program, 1) = 'T') OR
                                            (p.supervisor2 = fv.superviser AND p.supervisorTwoGetsMoney = 1 AND LEFT(fv.case_program, 1) = 'T') OR
                                            (p.assessmentMoneyToSupervisorOne = 1 AND p.supervisor1 = fv.superviser AND LEFT(fv.case_program, 1) = 'A') OR
                                            (p.assessmentMoneyToSupervisorTwo = 1 AND p.supervisor2 = fv.superviser AND LEFT(fv.case_program, 1) = 'A') 
                                        )
                                        
                                        AND description NOT IN (select name from non_remittable))
                                        UNION
                                        (
                                            SELECT *, DATEFROMPARTS(Year, Month , Day) AS FULLDATE from financial_view
                                            WHERE DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'
                                            AND Cast(act_date as date) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                            AND worker like '%${worker}%'
                                            AND description NOT IN (select name from non_remittable)
                                        )`)
        return resp.recordset
    } catch (error) {
        console.log('getPaymentData Function', error)
        return error
    }
}
exports.getPaymentDataForWorker = async (tempWorker, date, profileDates) => {
    try {
        let resp = await sql.query(`SELECT DISTINCT *, DATEFROMPARTS(Year, Month , Day) AS FULLDATE from financial_view
                                    WHERE DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'
                                    AND Cast(act_date as date) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                   AND worker like '%${tempWorker}%'
                                   AND description NOT IN (select name from non_remittable)`)
        return resp.recordset
    } catch (error) {
        // console.log(error)
    }
}
exports.getPaymentDataForWorkerBySupervisor = async (tempWorker, date, profileDates, supervisor) => {
    try {
        let resp = await sql.query(`SELECT DISTINCT *, DATEFROMPARTS(Year, Month , Day) AS FULLDATE from financial_view
                                    WHERE DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'
                                    AND Cast(act_date as date) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                   AND worker like '%${tempWorker}%' AND superviser like '${supervisor}'
                                   AND description NOT IN (select name from non_remittable)`)
        return resp.recordset
    } catch (error) {
        // console.log(error)
    }
}
exports.getSuperviseeiesL1 = async (superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] WHERE
                                    ((supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 1) AND associateType = 'L1 (Sup Prac)'
                                    OR (supervisor1 = '${superviser}' AND assessmentMoneyToSupervisorOne = 1) AND associateType = 'L1 (Sup Prac)')
                                    OR ((supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true') AND associateType = 'L1 (Sup Prac)'
                                    OR (supervisor2 = '${superviser}' AND assessmentMoneyToSupervisorTwo = 1) AND associateType = 'L1 (Sup Prac)')`)
        return resp.recordset
    } catch (error) {
        console.log(error, 'getSuperviseeiesL1')
    }
}
exports.getSuperviseeiesL1Assessments = async (superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] WHERE 
                                        (supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 'true'AND assessmentMoneyToSupervisorOne = 'true'  AND associateType = 'L1 (Sup Prac)')
                                        or (supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true'AND assessmentMoneyToSupervisorTwo = 'true' AND associateType = 'L1 (Sup Prac)')`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.superviserGetsAssessmentMoney = async (workerId) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`select supervisor1, supervisor2, supervisorOneGetsMoney,
                            supervisorTwoGetsMoney,assessmentMoneyToSupervisorOne, assessmentMoneyToSupervisorTwo 
                            FROM profiles where id ='${workerId}'`)
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
                                Or supervisor1 like '%${worker}%' AND supervisorOneGetsMoney =1 or supervisor2 like '%${worker}%' AND supervisorTwoGetsMoney = 1`)
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
exports.getAdjustmentsFeesInvoice = async (worker, superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`select associateName, adjustmentFee from profiles WHERE associateName like '%${worker}%' 
                                    Or supervisor1 like '%${worker}%' AND supervisorOneGetsMoney =1 or supervisor2 like '%${worker}%' AND supervisorTwoGetsMoney = 1`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}

exports.getAdjustmentsFeesWorkerOnlyInvoice = async (workerId, superviser) => {
    try {
        await sql.connect(config)
        let resp = await sql.query(`select associateName, adjustmentFee from profiles WHERE id = ${workerId}`)
        return resp.recordset
    } catch (error) {
        console.log(error)
    }
}