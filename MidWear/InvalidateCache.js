const sqlCache = require('../sql/cacheHandler').globalCache

exports.invalidateCache = (req, res, next) => {
    const invalidateCache = req.headers['invalidate-cache']
    if (invalidateCache) {
        sqlCache.flushAll()
    }
    next()

}