const axios = require('axios')
const { HOSTNAME, PORT } = require('../util/constants')
const { doAsyncWithRetry, exponentialBackoffDelay } = require('./exponentialBackoff')

exports.client = async (options = {
    method: 'get',
    url: `http://${HOSTNAME}:${PORT}`,
}) => await doAsyncWithRetry(async () => {
    const { method, url } = options
    const { data } = await axios({
        method,
        url
    })
    return data
}, e => e.response?.status === 429, exponentialBackoffDelay({ intervalMs: 2000, exponent: 1.5 }))