// const { getNotUnique } = require("./pdfKitFunctions")

const { findDuplicates, findSplitFees, removeSplitFees, removeDuplicates } = require("./pdfKitFunctions");
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



