module.exports.generateCacheKey = (worker, functionName) => {
    // Customize this function based on your specific requirements
    // You need to generate a unique key based on input parameters
    return `${worker}_${functionName}`;
}

module.exports.isTimeoutError = (error) => {
    return error.code === 'ETIMEOUT' || error.message.includes('timeout');
}

module.exports.delay = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}