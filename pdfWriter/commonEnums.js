
const PDFTYPE = {
    SINGLEPDF: 'singlepdf',
    MULTIPDF: 'multipdf'
};

const ACTIONTYPE = {
    PAYMENT: 'payment',
    INVOICE: 'invoice'
};


Object.freeze(PDFTYPE);
Object.freeze(ACTIONTYPE);
module.exports = { PDFTYPE, ACTIONTYPE };