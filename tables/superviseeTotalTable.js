
exports.superviseeTotalTable = async (date, worker) => {
    // let resp = await getSupervisiesFunc(worker, date)
    // console.log(resp)
    return {
        title: "Supervisee Total",
        subtitle: "From " + date.start + " To " + date.end,
        headers: ["Quantity", "Total"],
        rows: [
            ['Total', 'superviseeTotal'],
        ]
    }
}