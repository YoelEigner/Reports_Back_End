const { formatter } = require("../pdfWriter/pdfKitFunctions");


exports.OtherChargablesTable = (data, date, otherItems, workerProfile) => {

    data.map((item) => {
        const otherItem = otherItems.find(x => x.service_name === item.event_service_item_name);
        const isTherapy = item.service_name.startsWith('T_');
        //calulating fee as follws:
        //if the item is probono, then fee is the probono rate
        //if the item uses a fixed fee, then fee is the fixed fee regardless of the service_file
        //if the item is therapy, then fee is the therapy rate
        //else (this will be a catch all/ if an item is an assessment) fee is the total of the item * the assessment rate
        const fee = otherItem.is_probono_item
            ? Number(workerProfile.probono)
            : otherItem.use_fix_assoc_fee
                ? otherItem.assoc_rate
                : isTherapy
                    ? otherItem.therapy_rate
                    : Number(item.TOTAL.replace(/[^0-9.-]+/g, "")) * Number(workerProfile.assessmentRate) / 100

        item.fee = fee;
        item.otherItemTotal = fee * item.invoice_fee_qty;
    });

    const totals = calculateTotals(data);

    const totalAmt = Object.values(totals).reduce((a, b, index) => index % 2 === 0 ? a + b : a, 0)
    const totalQty = Object.values(totals).reduce((a, b, index) => index % 2 !== 0 ? a + b : a, 0)

    return {
        title: "Other Items",
        subtitle: "From " + date.start + " To " + date.end,
        otherItemsTotal: totals,
        headers: [
            { label: "Date", property: 'batch_date', renderer: null, align: "center" },
            { label: "Worker", property: 'event_primary_worker_name', renderer: null, align: "center" },
            { label: "Individual Name", property: 'individual_name', renderer: null, align: "center" },
            { label: "Invoice ID", property: 'invoice_id', renderer: null, align: "center" },
            { label: "Service Name", property: 'service_name', renderer: null, align: "center" },
            { label: "Cart Item", property: 'event_service_item_name', renderer: null, align: "center" },
            { label: "Fee", property: 'fee', renderer: null, align: "center" },
            { label: "Invoice Fee Qty", property: 'invoice_fee_qty', renderer: null, align: "center" },
            { label: "Total", property: 'otherItemTotal', renderer: null, align: "center" }
        ],
        datas: [...data],
        rows: [
            ['Total', '-', '-', '-', '-', '-', '-', totalQty, formatter.format(totalAmt)],
        ],
    }
};

const calculateTotals = (items) => {
    let totalAmtCPRI = 0, totalQtyCPRI = 0;
    let totalAmtCBT = 0, totalQtyCBT = 0;
    let totalAmtCFIR = 0, totalQtyCFIR = 0;
    let totalAmtTherapy = 0, totalQtyTherapy = 0;

    items.forEach(item => {
        if (item.service_name.startsWith('T_')) {
            totalAmtTherapy += item.otherItemTotal;
            totalQtyTherapy += item.invoice_fee_qty;
        } else if (item.service_name.startsWith('A_f_')) {
            totalAmtCPRI += item.otherItemTotal;
            totalQtyCPRI += item.invoice_fee_qty;
        } else if (item.service_name.startsWith('A_c_')) {
            totalAmtCBT += item.otherItemTotal;
            totalQtyCBT += item.invoice_fee_qty;
        } else if (item.service_name.startsWith('A__')) {
            totalAmtCFIR += item.otherItemTotal;
            totalQtyCFIR += item.invoice_fee_qty;
        }
    });

    return {
        //leave the keys as is in this order as they are used to calculate the totals on line 15
        totalAmtCPRI,
        totalQtyCPRI,
        totalAmtCBT,
        totalQtyCBT,
        totalAmtCFIR,
        totalQtyCFIR,
        totalAmtTherapy,
        totalQtyTherapy
    };
}