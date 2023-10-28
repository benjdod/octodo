const http = require('http')
const { HOSTNAME, PORT, SERVER_GREETING } = require('../util/constants')
const RequestLimiter = require('./requestLimiter')

const defaultRateLimitingOptions = {
    windowSizeMs: 30 * 1000,
    maxRequests: 3
}

exports.server = (port = PORT, rateLimitingOptions = defaultRateLimitingOptions) => {
    const { windowSizeMs, maxRequests } = { ...defaultRateLimitingOptions, ...rateLimitingOptions }
    const requestLimiter = new RequestLimiter(windowSizeMs, maxRequests)
    const httpServer = http.createServer((req, res) => {
        const clientAddress = req.socket.remoteAddress
        const now = Date.now()

        const retryAfter = requestLimiter.addRequest(clientAddress, now)
        
        if (retryAfter <= 0) {
            res.statusCode = 200
            res.end(SERVER_GREETING)
        } else {
            res.statusCode = 429
            res.setHeader('Retry-After', Math.ceil(retryAfter / 1000))
            res.end()
        }
    })
    let stopped = false

    return {
        start: async () => await new Promise((resolve, reject) => httpServer.listen(port, HOSTNAME, () => {
            if (stopped) reject('Server cannot be restarted')
            console.log(`Server listening on http://${HOSTNAME}:${port}...`)
            resolve()
        })),
        stop: async () => await new Promise(resolve => {
            stopped = true
            httpServer.close(resolve)
            console.log('Server stopping.')
        })
    }
}