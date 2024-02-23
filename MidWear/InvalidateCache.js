const sqlCache = require('../sql/cacheHandler').globalCache

exports.invalidateCache = async (req, res, next) => {
    const invalidateCache = req.headers['invalidate-cache']
    if (invalidateCache) {
        await sqlCache.flushAll()
    }
    next()
}