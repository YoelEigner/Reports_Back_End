const moment = require("moment");
const sql = require("mssql");
var CryptoJS = require("crypto-js");
const { generateCacheKey, isTimeoutError, delay } = require("./cacheHandler");
const sqlCache = require('./cacheHandler').globalCache



const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CACHE_TTL_SECONDS = 60;

const config = {
    user: "Node",
    password: process.env.DBPASS,
    server: "localhost\\SQLEXPRESS",
    database: "CFIR",
    port: 1433,
    options: {
        trustedConnection: false,
        trustServerCertificate: true,
        requestTimeout: 600000,
        connectionTimeout: 600000,
    },
    pool: {
        max: 500,
        min: 0,
    },
};

let pool;
async function getConnection() {
    if (!pool) {
        try {
            pool = await new sql.ConnectionPool(config).connect();
            console.log("Connected to the database.");
        } catch (err) {
            console.log("Error creating pool: ", err);
            throw err;
        }
    }
    return pool;
}

async function closeConnectionPool() {
    if (pool) {
        try {
            await pool.close();
            console.log("Connection pool closed.");
        } catch (err) {
            console.log("Error closing pool: ", err);
        } finally {
            pool = null; // Reset the pool after closing it
        }
    }
}

async function executeQuery(query, retryCount = 0) {
    try {
        const pool = await getConnection();
        const request = pool.request();

        const result = await request.query(query);

        return result.recordset;

    } catch (err) {
        if (retryCount < MAX_RETRIES && (isTimeoutError(err) || err.message.includes('timeout'))) {
            console.log(`Query failed due to timeout. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);

            // Close and reconnect the pool after failure
            await closeConnectionPool();
            await delay(RETRY_DELAY);

            // Retry the query
            return executeQuery(query, retryCount + 1);
        }

        // If we reached max retries or it's a different error, throw it
        console.error(`Query failed after ${retryCount + 1} attempts:`, err);
        throw err;
    }
}

exports.getProfileDates = async (workerId) => {
    const cacheKey = generateCacheKey(workerId, 'getProfileDates');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        let resp = await executeQuery(`select startDate, endDate from profiles where id = ${workerId}`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp[0];
    } catch (err) {
        console.log('profileDates Function', err); return err
    }
}

exports.deleteprofile = async (id) => {
    try {
        ;
        let resp = await executeQuery(`delete from profiles where id = ${id}`)
        if (resp.rowsAffected[0] === 1) return 200
        else return 500
    } catch (error) {
        console.log(error, 'Error deleing profile')
        return error
    }


}
exports.getInvoiceDataForWorker = async (date, worker, profileDates) => {
    const cacheKey = generateCacheKey(worker, 'getInvoiceDataForWorker');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {


        let resp = await executeQuery(`select DISTINCT *, FORMAT([event_service_item_total], 'C') as TOTAL, batch_date AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE batch_date
                                    >='${date.start}' and batch_date <='${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name] like '%${worker}%' AND event_service_item_name NOT IN (SELECT name FROM non_remittable)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getDataDate Function', err);
        return err
    }
}
exports.getSuperviseeDataBySuperviser = async (date, worker, profileDates, superviser) => {
    const cacheKey = generateCacheKey(worker, 'getSuperviseeDataBySuperviser');


    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {


        let resp = await executeQuery(`select *, FORMAT([event_service_item_total], 'C') as TOTAL, batch_date AS FULLDATE
                                    FROM [CFIR].[dbo].[invoice_data] WHERE batch_date
                                    >='${date.start}' and batch_date <='${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name] like '%${worker}%' AND [event_invoice_details_worker_name] like '%${superviser}%'
                                    AND event_service_item_name NOT IN (SELECT name FROM non_remittable)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getDataDate Function', err);
        return err
    }
}

exports.getInvoiceData = async (date, worker, profileDates, retryCount = 0) => {
    const cacheKey = generateCacheKey(worker, 'getInvoiceData');

    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`(SELECT DISTINCT i.*, FORMAT(i.[event_service_item_total], 'C') as TOTAL, i.batch_date AS FULLDATE
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
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        if (retryCount < MAX_RETRIES && isTimeoutError(error)) {
            await delay(RETRY_DELAY);
            return this.getInvoiceData(date, worker, profileDates, retryCount + 1);
        }
        return err
    }
}

exports.getAssociateTypes = async (associateType) => {
    const cacheKey = generateCacheKey(associateType, 'getAssociateTypes');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

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
    else if (associateType === 'summery') {
        temp = 'associateType'
        query = `SELECT * FROM [CFIR].[dbo].[profiles] WHERE associateType=associateType`
    }
    else {
        temp = `'${associateType}'`
        query = `SELECT * FROM [CFIR].[dbo].[profiles] WHERE associateType=${temp}`
    }
    try {

        let resp = await executeQuery(query)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getAssociateTypes FUnction', err); return err
    }
}
exports.getAssociateFeeBaseRate = async (workerId) => {
    const cacheKey = generateCacheKey(workerId, 'getAssociateFeeBaseRate');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT [associateType], [isSupervised], [supervisor1], [supervisor2], [supervisorOneGetsMoney], [supervisorTwoGetsMoney] ,[associateFeeBaseRate],
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
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getAssociateFeeBaseRate Function', err); return err
    }
}
exports.getAssociateLeval = async () => {
    const cacheKey = generateCacheKey('workerId', 'getAssociateLeval');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[associate_type]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getAssociateLeval Function', err); return err
    }
}
exports.getAssociateVideoFee = async (workerId) => {
    const cacheKey = generateCacheKey(workerId, 'getAssociateVideoFee');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT [videoTechMonthlyFee] FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log('getAssociateVideoFee Function', err); return err
    }
}

exports.getAssociateProfileById = async (workerId, retryCount = 0) => {
    const cacheKey = generateCacheKey(workerId, 'getAssociateProfileById');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[profiles] WHERE [id]='${workerId}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        if (retryCount < MAX_RETRIES && isTimeoutError(err)) {
            await delay(RETRY_DELAY);
            return this.getAssociateProfileById(workerId);
        }
        return err
    }
}
exports.getAllSuperviseeProfiles = async () => {
    const cacheKey = generateCacheKey('workerId', 'getAllSuperviseeProfiles');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[profiles] WHERE supervisorOneGetsMoney = 'true' or supervisorTwoGetsMoney = 'true'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log(err); return err
    }
}

exports.getphysicians = async () => {
    const cacheKey = generateCacheKey('workerId', 'getphysicians');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT [id],[associateName],[status], [startDate], [endDate], [associateType] FROM [CFIR].[dbo].[profiles]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getnewphysicians = async () => {
    const cacheKey = generateCacheKey('workerId', 'getnewphysicians');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[rpt_worker]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (err) {
        console.log(err); return err
    }
}
exports.getEmailPassword = async () => {
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[email_password]`)
        return resp;
    } catch (err) {
        console.log(err); return err
    }
}

exports.updateEmailPassword = async (password) => {
    const result = CryptoJS.AES.encrypt(password, process.env.KEY);
    // console.log(CryptoJS.AES.decrypt('U2FsdGVkX1+1PEm5EO+UWbzeep3WWO8Alg0eD48U4Hh9B0mtBZRughcKf3yHcrs/', process.env.KEY).toString(CryptoJS.enc.Utf8))
    // return 200;
    try {

        let resp = await executeQuery(`UPDATE [dbo].[email_password] SET [password] = '${result.toString()}' WHERE id = 1`)
        if (resp.rowsAffected[0] === 1) return 200
        else return 500
    } catch (err) {
        console.log(err); return 500
    }
}
exports.resetAdjustmentFees = async () => {
    try {

        let resp = await executeQuery(`UPDATE [dbo].[profiles] SET [adjustmentFee] = '${JSON.stringify([{ "name": "", "value": "0" }])}' ,
        [adjustmentPaymentFee] = '${JSON.stringify([{ "name": "", "value": "0" }])}' `)
        return 200;
    } catch (err) {
        console.log(err); return 500
    }
}

exports.getReportedItems = async (date, worker, profileDates, supervisor) => {
    const cacheKey = generateCacheKey(worker, 'getReportedItems');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select  [receipt_reason],[invoice_id], [service_name], [event_service_item_name],event_primary_worker_name, FORMAT(sum([event_service_item_total]), 'c') as TOTAL, sum([event_service_item_total]) as event_service_item_total,
                                    FORMAT([event_service_item_total], 'c') as itemTotal, COUNT([event_service_item_name]) as COUNT
                                    FROM [CFIR].[dbo].[invoice_data] 
                                    WHERE batch_date >= '${date.start}' and batch_date <= '${date.end}'
                                    AND batch_date >='${profileDates.startDate}' and batch_date <='${profileDates.endDate}'
                                    AND [event_primary_worker_name]='${worker}'
                                    AND event_invoice_details_worker_name like '${supervisor}'
                                    GROUP BY  [event_service_item_name], event_service_item_total,event_primary_worker_name,[receipt_reason],[service_name],[invoice_id]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (err) {
        console.log(err); return err
    }
}

exports.getProvinces = async () => {
    const cacheKey = generateCacheKey('workerId', 'getProvinces');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[provinces]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getWorkerProfile = async (id) => {
    const cacheKey = generateCacheKey(id, 'getWorkerProfile');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[profiles] where id=${id}`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getVideoTech = async () => {
    const cacheKey = generateCacheKey('id', 'getVideoTech');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[video_technology]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getServiceTypes = async () => {
    const cacheKey = generateCacheKey('workerId', 'getServiceTypes');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT *FROM [CFIR].[dbo].[service_files_names] `)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getPaymentTypes = async () => {
    const cacheKey = generateCacheKey('workerId', 'getPaymentTypes');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[payment_types] `)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getProcessingFee = async (feeName) => {
    const cacheKey = generateCacheKey(feeName, 'getProcessingFee');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[payment_types] where name ='${feeName}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.UpdateServiceTypes = async (arr, id, covrage) => {
    try {

        let resp = await executeQuery(`UPDATE [CFIR].[dbo].[profiles] SET [${covrage}] = '${arr}' WHERE id=${id}`)
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getNonChargeables = async () => {
    const cacheKey = generateCacheKey('feeName', 'getNonChargeables');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[non_chargeables]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getOtherItems = async () => {
    const cacheKey = generateCacheKey('feeName', 'getOtherItems');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[other_chargeables]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getSupervisers = async (name) => {
    const cacheKey = generateCacheKey(name, 'getSupervisers');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney, assessmentRate FROM [CFIR].[dbo].[profiles] where
                                      ((supervisor1='${name}' AND supervisorOneGetsMoney = 1 AND status =1)
                                      OR (supervisor2='${name}' AND supervisorTwoGetsMoney = 1 AND status =1))`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getSupervisersCFIR = async (name) => {
    const cacheKey = generateCacheKey(name, 'getSupervisersCFIR');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney, 
                                    assessmentMoneyToSupervisorOne, assessmentMoneyToSupervisorTwo, assessmentRate
                                    FROM [CFIR].[dbo].[profiles] where
                                    (supervisor1='${name}' AND (supervisorOneGetsMoney = 1 OR assessmentMoneyToSupervisorOne = 1 ) AND status =1 
                                    OR supervisor2='${name}' AND (supervisorTwoGetsMoney = 1 OR assessmentMoneyToSupervisorTwo = 1 )AND status =1)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getSupervisersAssessments = async (name) => {
    const cacheKey = generateCacheKey(name, 'getSupervisersAssessments');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName, associateType,[supervisor1],[supervisor2], supervisorOneGetsMoney, supervisorTwoGetsMoney, 
                                        assessmentMoneyToSupervisorOne,
                                        assessmentMoneyToSupervisorTwo, assessmentRate, probono FROM [CFIR].[dbo].[profiles] where
                                        (supervisor1='${name}' AND assessmentMoneyToSupervisorOne = 1)
                                        OR (supervisor2='${name}' AND assessmentMoneyToSupervisorTwo = 1)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.UpdateWorkerPreofile = async (arr, id) => {
    try {

        if (arr.associateName) {
            let checkForDuplicate = await executeQuery(`SELECT startDate, endDate, status, associateName, associateType from profiles WHERE associateName='${arr.associateName}' AND id !=${id} AND status=1`)

            let duplicateFound = false;
            checkForDuplicate.recordset.forEach(record => {
                if (record.associateName === arr.associateName) {
                    if ((new Date(arr.startDate) >= record.startDate && new Date(arr.startDate) <= record.endDate) || (new Date(arr.endDate) >= record.startDate && new Date(arr.endDate) <= record.endDate)) {
                        duplicateFound = true;
                    }
                }
            });
            if (!duplicateFound) {
                await executeQuery(`UPDATE [CFIR].[dbo].[profiles]
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

        let checkForOverlap = await executeQuery(`SELECT * FROM profiles WHERE '${arr.startDate}' <= endDate AND '${arr.endDate}' >= startDate AND associateName='${arr.associateName}' AND associateType = '${arr.associateType}'`);
        if (checkForOverlap.recordset.length === 0) {
            let resp = await executeQuery(`INSERT INTO [CFIR].[dbo].[profiles] (
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
            return { response: 200, new_id: resp[0] }
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

exports.getSummerizedInvoiceData = async (date, site, retryCount = 0) => {
    const cacheKey = generateCacheKey(`${site}-getSummerizedInvoiceData`);

    // Try to get the data from the cache
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        let resp = await executeQuery(`SELECT event_primary_worker_name, event_service_item_name, event_service_item_total, event_service_item_qty, Year, Month , Day, site, invoice_fee_qty
                                    FROM summarized_invoice_view 
                                    WHERE site like '%${site}%' AND DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (error) {
        if (retryCount < MAX_RETRIES && isTimeoutError(error)) {
            await delay(RETRY_DELAY);
            return this.getSummerizedInvoiceData(date, retryCount + 1);
        }
        console.log('getPaymentData Function', error)
        throw new Error(error);
    }
}

//****************Payment querys**********************/
exports.getSummerizedPaymentData = async (date, site, retryCount = 0) => {
    const cacheKey = generateCacheKey(`${site}-getSummerizedPaymentData`);

    // Try to get the data from the cache
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        let resp = await executeQuery(`SELECT worker, reason_type, applied_amt, site
                                    FROM financial_view 
                                    WHERE site like '%${site}%' AND DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (error) {
        if (retryCount < MAX_RETRIES && isTimeoutError(error)) {
            await delay(RETRY_DELAY);
            return this.getSummerizedPaymentData(date, retryCount + 1);
        }
        console.log('getPaymentData Function', error)
        throw new Error(error);
    }
}

// exports.getPaymentData = async (worker, date, profileDates, retryCount = 0) => {
//     const cacheKey = generateCacheKey(worker, 'getPaymentData');

//     // Try to get the data from the cache
//     const cachedData = sqlCache.get(cacheKey);
//     if (cachedData) {
//         return cachedData;
//     }

//     try {

//         let resp = await executeQuery(`
//                     SELECT 
//                         fv.*, 
//                         DATEFROMPARTS(fv.Year, fv.Month, fv.Day) AS FULLDATE 
//                     FROM 
//                         financial_view fv
//                     JOIN 
//                         profiles p ON (fv.superviser = p.associateName OR fv.worker = p.associateName) AND p.status = 1
//                     LEFT JOIN 
//                         non_remittable nr ON fv.description = nr.name
//                     WHERE 
//                         DATEFROMPARTS(fv.Year, fv.Month, fv.Day) BETWEEN '${date.start}' AND '${date.end}'
//                         AND DATEFROMPARTS(fv.Year, fv.Month, fv.Day) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
//                         AND (fv.superviser like '%${worker}%' OR fv.worker like '%${worker}%')
//                         AND (
//                             (p.supervisor1 = fv.superviser AND p.supervisorOneGetsMoney = 1 AND LEFT(fv.case_program, 1) = 'T') OR
//                             (p.supervisor2 = fv.superviser AND p.supervisorTwoGetsMoney = 1 AND LEFT(fv.case_program, 1) = 'T') OR
//                             (p.assessmentMoneyToSupervisorOne = 1 AND p.supervisor1 = fv.superviser AND LEFT(fv.case_program, 1) = 'A') OR
//                             (p.assessmentMoneyToSupervisorTwo = 1 AND p.supervisor2 = fv.superviser AND LEFT(fv.case_program, 1) = 'A') 
//                         )
//                         AND nr.name IS NULL
//                     UNION
//                     (
//                         SELECT 
//                             fv.*, 
//                             DATEFROMPARTS(fv.Year, fv.Month , fv.Day) AS FULLDATE 
//                         FROM 
//                             financial_view fv
//                         LEFT JOIN 
//                             non_remittable nr ON fv.description = nr.name
//                         WHERE 
//                             DATEFROMPARTS(fv.Year, fv.Month , fv.Day) BETWEEN '${date.start}' AND '${date.end}'
//                             AND DATEFROMPARTS(fv.Year, fv.Month , fv.Day) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
//                             AND fv.worker like '%${worker}%'
//                             AND nr.name IS NULL
//                     )
//                 `);
//         sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
//         return resp;
//     } catch (error) {
//         if (retryCount < MAX_RETRIES && isTimeoutError(error)) {
//             await delay(RETRY_DELAY);
//             return this.getPaymentData(worker, date, profileDates, retryCount + 1);
//         }
//         console.log('getPaymentData Function', error)
//         throw new Error(error);
//     }
// }

async function executeStoredProcedure(procedureName, params) {
    try {
        const pool = await sql.connect(config);
        const request = pool.request();

        // Add parameters to the request
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        // Execute the stored procedure
        const result = await request.execute(procedureName);
        console.log("🚀 ~ executeStoredProcedure ~ result:", result.recordset)
        
        return result.recordset;
    } catch (err) {
        console.error('SQL error', err);
        throw err;
    }
}

exports.getPaymentData = async (worker, date, profileDates, retryCount = 0) => {
    const cacheKey = generateCacheKey(worker, 'getPaymentData');

    // Try to get the data from the cache
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        // Prepare the parameters for the stored procedure
        const params = [
            { name: 'worker', type: sql.NVarChar(100), value: worker },
            { name: 'startDate', type: sql.Date, value: new Date(date.start) },
            { name: 'endDate', type: sql.Date, value: new Date(date.end) },
            { name: 'profileStartDate', type: sql.Date, value: new Date(profileDates.startDate) },
            { name: 'profileEndDate', type: sql.Date, value: new Date(profileDates.endDate) }
        ];

        // Execute the stored procedure
        let resp = await executeStoredProcedure('GetFinancialData', params);

        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (error) {
        if (retryCount < MAX_RETRIES && isTimeoutError(error)) {
            await delay(RETRY_DELAY);
            return this.getPaymentData(worker, date, profileDates, retryCount + 1);
        }
        console.log('getPaymentData Function', error);
        throw new Error(error);
    }
}
exports.getPaymentDataForWorker = async (tempWorker, date, profileDates) => {
    const cacheKey = generateCacheKey(tempWorker, 'getPaymentDataForWorker');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        let resp = await executeQuery(`SELECT DISTINCT *, DATEFROMPARTS(Year, Month , Day) AS FULLDATE from financial_view
                                    WHERE DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'
                                    AND DATEFROMPARTS(Year, Month , Day) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                   AND worker like '%${tempWorker}%'
                                   AND description NOT IN (select name from non_remittable)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (error) {
        // console.log(error)
    }
}
exports.getPaymentDataForWorkerBySupervisor = async (tempWorker, date, profileDates, supervisor) => {
    const cacheKey = generateCacheKey(tempWorker, 'getPaymentDataForWorkerBySupervisor');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {
        let resp = await executeQuery(`SELECT DISTINCT *, DATEFROMPARTS(Year, Month , Day) AS FULLDATE from financial_view
                                    WHERE DATEFROMPARTS(Year, Month , Day) BETWEEN '${date.start}' AND '${date.end}'
                                    AND DATEFROMPARTS(Year, Month , Day) BETWEEN '${profileDates.startDate}' AND '${profileDates.endDate}'
                                   AND worker like '%${tempWorker}%' AND superviser like '${supervisor}'
                                   AND description NOT IN (select name from non_remittable)`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp;
    } catch (error) {
        // console.log(error)
    }
}
exports.getSuperviseeiesL1 = async (superviser) => {
    const cacheKey = generateCacheKey(superviser, 'getSuperviseeiesL1');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] WHERE
                                    ((supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 1) AND associateType = 'L1 (Sup Prac)'
                                    OR (supervisor1 = '${superviser}' AND assessmentMoneyToSupervisorOne = 1) AND associateType = 'L1 (Sup Prac)')
                                    OR ((supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true') AND associateType = 'L1 (Sup Prac)'
                                    OR (supervisor2 = '${superviser}' AND assessmentMoneyToSupervisorTwo = 1) AND associateType = 'L1 (Sup Prac)')`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error, 'getSuperviseeiesL1')
    }
}
exports.getSuperviseeiesL1Assessments = async (superviser) => {
    const cacheKey = generateCacheKey(superviser, 'getSuperviseeiesL1Assessments');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] WHERE 
                                        (supervisor1 = '${superviser}' AND supervisorOneGetsMoney = 'true'AND assessmentMoneyToSupervisorOne = 'true'  AND associateType = 'L1 (Sup Prac)')
                                        or (supervisor2 = '${superviser}' AND supervisorTwoGetsMoney = 'true'AND assessmentMoneyToSupervisorTwo = 'true' AND associateType = 'L1 (Sup Prac)')`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.superviserGetsAssessmentMoney = async (workerId) => {
    const cacheKey = generateCacheKey(workerId, 'superviserGetsAssessmentMoney');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select supervisor1, supervisor2, supervisorOneGetsMoney,
                            supervisorTwoGetsMoney,assessmentMoneyToSupervisorOne, assessmentMoneyToSupervisorTwo 
                            FROM profiles where id ='${workerId}'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);

        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getNonRemittables = async () => {
    const cacheKey = generateCacheKey('workerId', 'getNonRemittables');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[non_remittable]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getWorkerId = async (partialName) => {
    const cacheKey = generateCacheKey(partialName, 'getWorkerId');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT id, associateName FROM [CFIR].[dbo].[profiles] where associateName like '%${partialName}%'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getAssessmentItemEquivalent = async () => {
    const cacheKey = generateCacheKey('workerId', 'getAssessmentItemEquivalent');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`SELECT * FROM [CFIR].[dbo].[assessmentItemslookup]`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}


exports.getAdjustmentsFees = async (worker, superviser) => {
    const cacheKey = generateCacheKey(worker, 'getAdjustmentsFees');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select associateName, adjustmentPaymentFee from profiles WHERE associateName like '%${worker}%' 
                                Or supervisor1 like '%${worker}%' AND supervisorOneGetsMoney =1 or supervisor2 like '%${worker}%' AND supervisorTwoGetsMoney = 1`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getAdjustmentsFeesWorkerOnly = async (worker, superviser) => {
    const cacheKey = generateCacheKey(worker, 'getAdjustmentsFeesWorkerOnly');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select associateName, adjustmentPaymentFee from profiles WHERE associateName like '%${worker}%'`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}
exports.getAdjustmentsFeesInvoice = async (worker, superviser) => {
    const cacheKey = generateCacheKey(worker, 'getAdjustmentsFeesInvoice');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select associateName, adjustmentFee from profiles WHERE associateName like '%${worker}%' 
                                    Or supervisor1 like '%${worker}%' AND supervisorOneGetsMoney =1 or supervisor2 like '%${worker}%' AND supervisorTwoGetsMoney = 1`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}

exports.getAdjustmentsFeesWorkerOnlyInvoice = async (workerId, superviser) => {
    const cacheKey = generateCacheKey(workerId, 'getAdjustmentsFeesWorkerOnlyInvoice');
    const cachedData = sqlCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {

        let resp = await executeQuery(`select associateName, adjustmentFee from profiles WHERE id = ${workerId}`)
        sqlCache.set(cacheKey, resp, CACHE_TTL_SECONDS);
        return resp
    } catch (error) {
        console.log(error)
    }
}