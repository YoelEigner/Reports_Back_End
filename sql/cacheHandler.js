const NodeCache = require('node-cache');
module.exports.globalCache = new NodeCache();

module.exports.generateCacheKey = (worker, functionName) => {
    return `${worker}_${functionName}`;
}

module.exports.isTimeoutError = (error) => {
    return error.code === 'ETIMEOUT' || error.message.includes('timeout');
}

module.exports.delay = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}