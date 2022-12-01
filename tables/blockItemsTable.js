const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.blockItemsTable = (date, data) => {
    return {
        title: "In Office Blocks",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Blocks", property: 'inOfficeBlocks', renderer: null , align: "center"},
            { label: "Block hours", property: 'inOfficeBlockHours', renderer: null, align: "center" },
            { label: "Block hourly Rate", property: 'blocksHourlyRate', renderer: null, align: "center" },
            { label: "Block Bi Weekly Rate", property: 'blocksBiWeeklyCharge', renderer: null, align: "center" },
        ],
        datas: [...data],
    }
}