// const { getNotUnique } = require("./pdfKitFunctions")

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
exports.removeDuplicateAndSplitFees = (array) => {
    const seen = new Set();
    const duplicateItemsAndSplitFees = array.filter(item => {
        const key = `${item.event_id}-${item.case_file_name}`;
        // const key = `${item.individual_name}-${item.event_id}-${item.case_file_name}-${item.event_service_item_name}-${item.event_invoice_details_worker_name}`;
        if (seen.has(key)) {
            return true;
        }
        seen.add(key);
        return false;
    });
    // const splitFeesArr = array.filter(item => {
    //     const key = `${item.individual_name}-${item.event_service_item_name}-${item.event_service_item_qty}-${item.event_service_item_tax_total}-${item.applied_credit_amt}`;
    //     if (seen.has(key)) {
    //         return true;
    //     }
    //     seen.add(key);
    //     return false;
    // });
    // let duplicateItemsAndSplitFees = [...duplicateItemsArr, ...splitFeesArr]

    return { duplicateItemsAndSplitFees }
}

exports.removeDuplicateAndSplitFeesFromArr = (array) => {
    const seen = new Set();
    const duplicateItemsAndSplitFeesRemoved = array.filter((item, index) => {
        const key = `${item.event_id}-${item.case_file_name}`;
        // const key = `${item.individual_name}-${item.event_id}-${item.case_file_name}-${item.event_service_item_name}-${item.event_invoice_details_worker_name}`;
        if (seen.has(key)) {
            // if (index === 0) return true; // Keep first item
            return false;
        }
        seen.add(key);
        return true;
    });
    return { duplicateItemsAndSplitFeesRemoved }

}