const { doAsyncWithRetry, exponentialBackoffDelay } = require('../src/exponentialBackoff')

describe('doAsyncWithRetry', () => {
    test('resolves when nothing is thrown', async () => {
        const result = await doAsyncWithRetry(async () => {
            return 0xABC
        }, () => false, () => 1)

        expect(result).toBe(0xABC)
    })

    test('retries when error matches the filter function', async () => {
        let i = 0

        const result = await doAsyncWithRetry(async () => {
            if (i < 1) {
                i += 1
                throw 'retry!'
            }
            return 0xABC
        }, e => e === 'retry!', () => 1)

        expect(result).toBe(0xABC)
    })

    test('retries 10 times and then succeeds', async () => {
        const testRetries = 10;

        let i = 0;
        let actualRetries = 0

        const result = await doAsyncWithRetry(async () => {
            if (i < testRetries) {
                i += 1
                throw 'retry!'
            }
            return 0xABC
        }, e => e === 'retry!', () => { actualRetries += 1; return 1; })

        expect(actualRetries).toEqual(testRetries)
        expect(result).toBe(0xABC)
    })

    test('rejects when error does not match the filter function', async () => {
        return expect(async () => await doAsyncWithRetry(async () => {
            throw 'Catastrophic error...'
        }, e => e === 'retry!', () => 1)).rejects.toBe('Catastrophic error...')
    })

    test('retries 10 times and then rejects when error does not match the filter function', async () => {
        const testRetries = 10;

        let i = 0;
        let actualRetries = 0

        return expect(async () => await doAsyncWithRetry(async () => {
            if (i < testRetries) {
                i += 1
                throw 'retry!'
            } else {
                throw `total retries: ${actualRetries}`
            }
        }, e => e === 'retry!', () => { actualRetries += 1; return 1; })).rejects.toBe(`total retries: ${testRetries}`)
    }, 10000)
})

describe('exponentialBackoffDelay', () => {
    test('returns proper values for { int: 1000, exp: 1 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 1000, exponent: 1 })
        expect(delayFor(0)).toBe(1000)
        expect(delayFor(1)).toBe(1000)
        expect(delayFor(2)).toBe(1000)
    })

    test('returns proper values for { int: 1000, exp: 2 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 1000, exponent: 2 })
        expect(delayFor(0)).toBe(1000)
        expect(delayFor(1)).toBe(2000)
        expect(delayFor(2)).toBe(4000)
        expect(delayFor(3)).toBe(8000)
        expect(delayFor(4)).toBe(16000)
    })

    test('returns proper values for { int: 1000, exp: 1.5 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 1000, exponent: 1.5 })
        expect(delayFor(0)).toBe(1000)
        expect(delayFor(1)).toBe(1500)
        expect(delayFor(2)).toBe(2250)
        expect(delayFor(3)).toBe(3375)
    })

    test('returns proper values for { int: 2000, exp: 1.8 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 2000, exponent: 1.8 })
        expect(delayFor(0)).toBe(2000)
        expect(delayFor(1)).toBe(3600)
        expect(delayFor(2)).toBe(6480)
        expect(delayFor(3)).toBeCloseTo(11664, 5)
    })

    test('returns proper values for { int: 2000, exp: 2 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 2000, exponent: 2 })
        expect(delayFor(0)).toBe(2000)
        expect(delayFor(1)).toBe(4000)
        expect(delayFor(2)).toBe(8000)
        expect(delayFor(3)).toBe(16000)
        expect(delayFor(4)).toBe(32000)
    })

    test('returns proper values for { int: 2300, exp: 1.47 }', () => {
        const delayFor = exponentialBackoffDelay({ intervalMs: 2300, exponent: 1.47 })
        expect(delayFor(0)).toBe(2300)
        expect(delayFor(1)).toBeCloseTo(3381, 0)
        expect(delayFor(2)).toBeCloseTo(4970.07, 2)
        expect(delayFor(3)).toBeCloseTo(7306.00, 2)
    })
})