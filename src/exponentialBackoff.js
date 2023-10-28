const defaultExponentialBackoffOptions = {
    intervalMs: 1000,
    exponent: 2
}

/**
 * @typedef {(retryCount: number) => number} GetRetryDelay
 */


/**
 * @param {number} retryOptions.intervalMs - retry interval expressed in milliseconds
 * @param {number} retryOptions.exponent - retry exponent
 * @returns {GetRetryDelay}
 */
const exponentialBackoffDelay = (retryOptions = defaultExponentialBackoffOptions) => {
    const { intervalMs, exponent } = { ...defaultExponentialBackoffOptions, ...retryOptions }
    return retryCount => intervalMs * Math.pow(exponent, retryCount)
}

/**
 * @param {() => Promise<any>} fnAsync
 * @param {(error: any) => boolean} retryIf
 * @param {GetRetryDelay} getRetryDelay
 * @returns a promise that resolves and rejects with the inner function except when retry conditions are met
 */
const doAsyncWithRetry = async (fnAsync, retryIf, getRetryDelay) => {
    let retryCount = -1

    while (true) {
        if (retryCount > -1) await new Promise(resolve => setTimeout(resolve, getRetryDelay(retryCount)))

        try {
            return await fnAsync()
        } catch (e) {
            if (retryIf(e)) {
                retryCount += 1
            } else {
                throw e
            }
        }
    }
}

module.exports = {
    doAsyncWithRetry,
    exponentialBackoffDelay
}