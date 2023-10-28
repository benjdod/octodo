module.exports = class RequestLimiter {
    constructor (windowSizeMs, requestsPerWindow) {
        this.windowSizeMs = windowSizeMs
        this.requestsPerWindow = requestsPerWindow

        this.requestsByAddress = {}
    }

    /**
     * @method adds a request to the limiter for the given address
     * @param {string} address - client address of the request
     * @param {number?} timestampMs - request timestam expressed in UNIX ms
     * @returns {number} if the request can be added to the limiter, 0 is returned. Otherwise, the time to retry after is returned in milliseconds.
     */
    addRequest(address, timestampMs) {
        timestampMs ??= Date.now()
        this.requestsByAddress[address] ??= []

        const requests = this.requestsByAddress[address]

        while (requests?.[0] + this.windowSizeMs < timestampMs) {
            requests.splice(0, 1)
        }

        if (requests.length < this.requestsPerWindow) {
            requests.push(timestampMs)
            return 0
        }

        return this.windowSizeMs - (timestampMs - requests?.[0])
    }
}