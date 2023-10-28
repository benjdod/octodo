const axios = require('axios')
const { HOSTNAME, PORT } = require('../util/constants')
const { doAsyncWithRetry, exponentialBackoffDelay } = require('./exponentialBackoff')

/**
 * @description client is a single async function that issues an HTTP request to an 
 * endpoint and performs retry with exponential backoff on behalf of the user.
 *
 * @param {string} options.method - HTTP method to use
 * @param {string} options.url - URL to send the request to
 */
exports.client = async (options = {
    method: 'get',
    url: `http://${HOSTNAME}:${PORT}`
}) => await doAsyncWithRetry(async () => {
    const { method, url } = options
    const response = await axios({
        method,
        url
    })
    return response.data
}, e => e.response?.status === 429, exponentialBackoffDelay({ intervalMs: 2000, exponent: 1.5 }))