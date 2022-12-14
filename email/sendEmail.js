const nodemailer = require('nodemailer');
const { getEmailPassword } = require('../sql/sql');

exports.sendEmail = async (email, worker, pdfData, pass, type) => {
    let emailTemplate = await getEmailPassword()
    return new Promise(async (resolve, reject) => {
        try {
            let transporter = nodemailer.createTransport({
                host: "smtp.office365.com",
                port: 587,
                secure: false,
                auth: {
                    user: 'accounting@cfir.ca',
                    pass: pass,
                },
            });
        
            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: 'accounting@cfir.ca', // sender address
                to: email,
                subject: `CFIR ${type} Report`, // Subject line
                html: emailTemplate[0].emailTemplate, // html body
                attachments: [{
                    filename: worker + '.pdf',
                    content: pdfData
                }]
            });
            if (info.rejected.length === 0) {
                resolve(200)
            }
            else {
                reject(500)
            }
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })

}