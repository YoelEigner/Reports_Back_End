// const { getNotUnique } = require("./pdfKitFunctions")

const { findDuplicates, findSplitFees, removeSplitFees, removeDuplicates } = require("./pdfKitFunctions");

// exports.removeDuplicateAndSplitFees = (data) => {
//     console.log(data)
//     let duplicateIds = getNotUnique(data.map(x => x.event_id))
//     let duplicateItemsId = data.filter(x => duplicateIds.includes(x.event_id) && x.event_service_item_name.substring(0, 3) !== 'A__')

//     let duplicateCaseFileNme = getNotUnique(duplicateItemsId.map(x => x.case_file_name))
//     let duplicateItemsCaseFileNames = duplicateItemsId.filter(x => duplicateCaseFileNme.includes(x.case_file_name))

//     let duplicateItemName = getNotUnique(duplicateItemsCaseFileNames.map(x => x.event_service_item_name))
//     let duplicateItems = duplicateItemsId.filter(x => duplicateItemName.includes(x.event_service_item_name))

//     return { duplicateItems, duplicateItemsId }
// }
exports.duplicateAndSplitFees = (array) => {
    const duplicateItemsArr = findDuplicates(array)
    const splitFeesArr = findSplitFees(array)
    let duplicateItemsAndSplitFees = [...duplicateItemsArr, ...splitFeesArr]

    return { duplicateItemsAndSplitFees }
}

exports.duplicateAndSplitFeesRemoved = (array) => {
    const duplicateItemsArr = removeDuplicates(array)
    const duplicateItemsAndSplitFeesRemoved = removeSplitFees(duplicateItemsArr)
    return { duplicateItemsAndSplitFeesRemoved }

}



