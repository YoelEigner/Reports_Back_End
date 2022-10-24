
exports.thirdPartyFeesTable = (date, items, itemQty, total) => {
    return {
        title: "Third Party Payments",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Item", renderer: null, align: "center"},
            { label: "Quantity", renderer: null, align: "center" },
            { label: "Total", renderer: null, align: "center" },
        ],
        rows: [
            [ 'Total', 0, total]
        ]
    }
}