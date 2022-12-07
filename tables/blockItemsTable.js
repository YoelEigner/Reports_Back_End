const { formatter } = require("../pdfWriter/pdfKitFunctions")

exports.blockItemsTable = (date, workerProfiles, equivalentHours, data) => {
    data.map(x => x.equivalentHours = equivalentHours.find(i => x.description === i.assesment_item_name)?.hours_eqivalent)
    workerProfiles[0].equivalentHours = data.map(x => x.equivalentHours !== undefined ? Number(x.equivalentHours) : 1).reduce((a, b) => a + b, 0)
    workerProfiles.map(x => {
        x.equivalentHoursFee = x.equivalentHours * x.blocksHourlyRate
        x.newBiWeeklyRate = x.blocksBiWeeklyCharge - x.equivalentHoursFee
    })
    // console.log(workerProfiles)

    return {
        title: "In Office Blocks",
        subtitle: "From " + date.start + " To " + date.end,
        headers: [
            { label: "Blocks", property: 'inOfficeBlocks', renderer: null, align: "center" },
            { label: "Block Hours", property: 'inOfficeBlockHours', renderer: null, align: "center" },
            { label: "Blocks Used (Assessments)", property: 'equivalentHours', renderer: null, align: "center" },
            { label: "Assessment Blocks Rate", property: 'equivalentHoursFee', renderer: null, align: "center" },
            { label: "Hourly Rate", property: 'blocksHourlyRate', renderer: null, align: "center" },
            { label: "Bi Weekly Rate", property: 'blocksBiWeeklyCharge', renderer: null, align: "center" },
            { label: "Block Final Rate", property: 'newBiWeeklyRate', renderer: null, align: "center" },
        ],
        datas: [...workerProfiles],
    }
}