const { formatter } = require("../pdfWriter/pdfKitFunctions");
const { getPrefixesItems } = require("../sql/sql");


exports.OtherChargablesTable = async (data, date, otherItems, workerProfile) => {
    const filteredArray = data.filter((worker) => workerProfile.associateName === worker.event_primary_worker_name)

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


    const totalsForUser = await calculateTotals(filteredArray);
    const totals = await calculateTotals(data);
    const totalAmt = Object.keys(totals)
        .filter(key => key.startsWith('totalAmt'))
        .reduce((total, key) => total + totals[key], 0);

    const totalQty = Object.keys(totals)
        .filter(key => key.startsWith('totalQty'))
        .reduce((total, key) => total + totals[key], 0);


    return {
        title: "Other Items",
        subtitle: "From " + date.start + " To " + date.end,
        otherItemsTotal: totalsForUser,
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

const calculateTotals = async (items) => {
    let totals = {};
    let prefixes = await getPrefixesItems()

    prefixes.forEach(prefixInfo => {
        const type = prefixInfo.type;
        const totalAmtKey = `totalAmt${type}`;
        const totalQtyKey = `totalQty${type}`;
        totals[totalAmtKey] = 0;
        totals[totalQtyKey] = 0;
    });

    items.forEach(item => {
        const matchingPrefix = prefixes.find(prefix => item.service_name.startsWith(prefix.prefix));
        if (matchingPrefix) {
            const type = matchingPrefix.type;
            const totalAmtKey = `totalAmt${type}`;
            const totalQtyKey = `totalQty${type}`;
            if (!totals[totalAmtKey]) {
                totals[totalAmtKey] = 0;
                totals[totalQtyKey] = 0;
            }
            totals[totalAmtKey] += item.otherItemTotal;
            totals[totalQtyKey] += item.invoice_fee_qty;
        }
    });

    return totals;
}