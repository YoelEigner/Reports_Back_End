
const PDFTYPE = {
    SINGLEPDF: 'singlepdf',
    MULTIPDF: 'multipdf',
    SUMMERY: 'summery',
};

const ACTIONTYPE = {
    PAYMENT: 'payment',
    INVOICE: 'invoice'
};


Object.freeze(PDFTYPE);
Object.freeze(ACTIONTYPE);
module.exports = { PDFTYPE, ACTIONTYPE };