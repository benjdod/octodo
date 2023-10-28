const RequestLimiter = require('../src/requestLimiter')


const mockAddresses = {
    address1: '127.0.0.1',
    address2: '8.8.8.8',
    address3: '1.1.1.1'
}

describe('RequestLimiter', () => {
    test('allows a single request', () => {
        var limiter = new RequestLimiter(3000, 3)

        const retryAfter = limiter.addRequest(mockAddresses.address1, Date.now())

        expect(retryAfter).toBe(0)
    })

    test('allows 3 requests', () => {
        var limiter = new RequestLimiter(3000, 3)

        const retryAfter1 = limiter.addRequest(mockAddresses.address1, Date.now())
        const retryAfter2 = limiter.addRequest(mockAddresses.address1, Date.now())
        const retryAfter3 = limiter.addRequest(mockAddresses.address1, Date.now())

        expect(retryAfter1).toBe(0)
        expect(retryAfter2).toBe(0)
        expect(retryAfter3).toBe(0)
    })

    test('allows 3 requests and blocks the 4th request in a short timespan', () => {
        var limiter = new RequestLimiter(3000, 3)

        const retryAfter1 = limiter.addRequest(mockAddresses.address1, Date.now())
        const retryAfter2 = limiter.addRequest(mockAddresses.address1, Date.now())
        const retryAfter3 = limiter.addRequest(mockAddresses.address1, Date.now())
        const retryAfter4 = limiter.addRequest(mockAddresses.address1, Date.now())

        expect(retryAfter1).toBe(0)
        expect(retryAfter2).toBe(0)
        expect(retryAfter3).toBe(0)
        expect(retryAfter4).not.toBe(0)
    })

    test('allows > 3 spaced-out requests in a long timespan', () => {
        var limiter = new RequestLimiter(3000, 3)

        const now = Date.now()

        const retryAfter1 = limiter.addRequest(mockAddresses.address1, now)
        const retryAfter2 = limiter.addRequest(mockAddresses.address1, now + 800)
        const retryAfter3 = limiter.addRequest(mockAddresses.address1, now + 2300)
        const retryAfter4 = limiter.addRequest(mockAddresses.address1, now + 3100)
        const retryAfter5 = limiter.addRequest(mockAddresses.address1, now + 3801)
        const retryAfter6 = limiter.addRequest(mockAddresses.address1, now + 5350)

        expect(retryAfter1).toBe(0)
        expect(retryAfter2).toBe(0)
        expect(retryAfter3).toBe(0)
        expect(retryAfter4).toBe(0)
        expect(retryAfter5).toBe(0)
        expect(retryAfter6).toBe(0)
    })

    test('Drops requests that are too close together', () => {
        var limiter = new RequestLimiter(3000, 3)

        const now = Date.now()

        const retryAfter1 = limiter.addRequest(mockAddresses.address1, now)
        const retryAfter2 = limiter.addRequest(mockAddresses.address1, now + 800)
        const retryAfter3 = limiter.addRequest(mockAddresses.address1, now + 2300)
        const retryAfter4 = limiter.addRequest(mockAddresses.address1, now + 2900)
        const retryAfter5 = limiter.addRequest(mockAddresses.address1, now + 3100)
        const retryAfter6 = limiter.addRequest(mockAddresses.address1, now + 3300)

        const retryAfter7 = limiter.addRequest(mockAddresses.address1, now + 6600)
        const retryAfter8 = limiter.addRequest(mockAddresses.address1, now + 6601)
        const retryAfter9 = limiter.addRequest(mockAddresses.address1, now + 6602)

        expect(retryAfter1).toBe(0)
        expect(retryAfter2).toBe(0)
        expect(retryAfter3).toBe(0)
        expect(retryAfter4).toBe(100)
        expect(retryAfter5).toBe(0)
        expect(retryAfter6).toBe(500)

        expect(retryAfter7).toBe(0)
        expect(retryAfter8).toBe(0)
        expect(retryAfter9).toBe(0)
    })

    test('allows max 3 requests from multiple address in a short timespan', () => {
        var limiter = new RequestLimiter(3000, 3)

        const now = Date.now()

        const address1Retry = {
            r1: limiter.addRequest(mockAddresses.address1, now),
            r2: limiter.addRequest(mockAddresses.address1, now + 1),
            r3: limiter.addRequest(mockAddresses.address1, now + 2),
            r4: limiter.addRequest(mockAddresses.address1, now + 3),
        }

        const address2Retry = {
            r1: limiter.addRequest(mockAddresses.address2, now),
            r2: limiter.addRequest(mockAddresses.address2, now + 1),
            r3: limiter.addRequest(mockAddresses.address2, now + 2),
            r4: limiter.addRequest(mockAddresses.address2, now + 5),
        }

        const address3Retry = {
            r1: limiter.addRequest(mockAddresses.address3, now),
            r2: limiter.addRequest(mockAddresses.address3, now + 1),
            r3: limiter.addRequest(mockAddresses.address3, now + 2),
            r4: limiter.addRequest(mockAddresses.address3, now + 4),
        }

        expect(address1Retry.r1).toBe(0)
        expect(address1Retry.r2).toBe(0)
        expect(address1Retry.r3).toBe(0)
        expect(address1Retry.r4).toBe(2997)

        expect(address2Retry.r1).toBe(0)
        expect(address2Retry.r2).toBe(0)
        expect(address2Retry.r3).toBe(0)
        expect(address2Retry.r4).toBe(2995)

        expect(address3Retry.r1).toBe(0)
        expect(address3Retry.r2).toBe(0)
        expect(address3Retry.r3).toBe(0)
        expect(address3Retry.r4).toBe(2996)
    })
})