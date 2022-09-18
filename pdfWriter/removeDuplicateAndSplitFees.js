const { getNotUnique } = require("./pdfKitFunctions")

exports.removeDuplicateAndSplitFees = (data) => {
    let duplicateIds = getNotUnique(data.map(x => x.event_id))
    let duplicateItemsId = data.filter(x => duplicateIds.includes(x.event_id) && x.event_service_item_name.substring(0, 3) !== 'A__')
    let duplicateCaseFileNme = getNotUnique(duplicateItemsId.map(x => x.case_file_name))
    let duplicateItemsCaseFileNames = duplicateItemsId.filter(x => duplicateCaseFileNme.includes(x.case_file_name))
    let duplicateItemName = getNotUnique(duplicateItemsCaseFileNames.map(x => x.event_service_item_name))
    let duplicateItems = duplicateItemsId.filter(x => duplicateItemName.includes(x.event_service_item_name))

    return { duplicateItems, duplicateItemsId }
}