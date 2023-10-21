const { findDuplicates, findSplitFees, removeSplitFees, removeDuplicates, findPaymentDuplicates, findPaymentSplitFees, removePaymentDuplicates, removePaymentSplitFees } = require("./pdfKitFunctions");
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

exports.paymentDuplicateAndSplitFees = (array) => {
    const duplicateItemsArr = findPaymentDuplicates(array)
    const splitFeesArr = findPaymentSplitFees(array)
    let duplicateItemsAndSplitFees = [...duplicateItemsArr, ...splitFeesArr]
    return { duplicateItemsAndSplitFees }
}

exports.paymentDuplicateAndSplitFeesRemoved = (array) => {
    const duplicateItemsArr = removePaymentDuplicates(array)
    const duplicateItemsAndSplitFeesRemoved = removePaymentSplitFees(duplicateItemsArr)
    return { duplicateItemsAndSplitFeesRemoved }

}



