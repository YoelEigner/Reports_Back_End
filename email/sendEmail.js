const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
exports.sendEmail = async (email, worker, pdfData, pass) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        // host: "smtp.office365.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'accounting@cfir.ca',
            pass: pass,
        },
    });


    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'accounting@cfir.ca', // sender address
        to: email, // list of receivers
        subject: "CFIR Report", // Subject line
        html: "<b>Please see your attached invoice!</b>", // html body
        attachments: [{
            filename: worker + '.pdf',
            content: pdfData
        }]
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}
