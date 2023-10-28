const { client } = require('../src/client')
const { server } = require('../src/server')
const { SERVER_GREETING } = require('../util/constants.js')

let svr = undefined

beforeEach(async () => {
    svr = undefined
    svr = server()
    await svr.start()
    await waitFor(250).milliseconds()
})

afterEach(async () => {
    await svr.stop()
    await waitFor(250).milliseconds()
})

describe('server-client interaction', () => {
    test('client successfully calls the server once', async () => {
        const data = await client()
        expect(data).toBe(SERVER_GREETING)
    })

    test('client successfully calls the server three times in short order', async () => {
        const response1 = await client()
        expect(response1).toBe(SERVER_GREETING)

        await waitFor(1).seconds()

        const response2 = await client()
        expect(response2).toBe(SERVER_GREETING)

        await waitFor(1).seconds()

        const response3 = await client()
        expect(response3).toBe(SERVER_GREETING)
    })

    test('client is throttled when calling the server four times in short order', async () => {
        const startTime = Date.now()
        const response1 = await client()
        expect(response1).toBe(SERVER_GREETING)

        await waitFor(100).milliseconds()

        const response2 = await client()
        expect(response2).toBe(SERVER_GREETING)

        await waitFor(100).milliseconds()

        const response3 = await client()
        expect(response3).toBe(SERVER_GREETING)

        const response4 = await client()
        expect(response4).toBe(SERVER_GREETING)

        const endTime = Date.now()

        const runtimeMs = endTime - startTime

        expect(runtimeMs).toBeGreaterThanOrEqual(30 * 1000)
        expect(runtimeMs).toBeLessThanOrEqual(60 * 1000)
    }, 60 * 1000)

    test('client is not throttled when request rate is less than 3/30sec', async () => {
        const startTime = Date.now()

        const response1 = await client()
        expect(response1).toBe(SERVER_GREETING)

        await waitFor(11).seconds()

        const response2 = await client()
        expect(response2).toBe(SERVER_GREETING)

        await waitFor(11).seconds()

        const response3 = await client()
        expect(response3).toBe(SERVER_GREETING)

        await waitFor(11).seconds()

        const request4StartTime = Date.now()

        const response4 = await client()
        expect(response4).toBe(SERVER_GREETING)

        const request4EndTime = Date.now()

        const endTime = Date.now()

        const runtimeMs = endTime - startTime

        expect(runtimeMs).toBeGreaterThanOrEqual(30 * 1000)
        expect(runtimeMs).toBeLessThanOrEqual(60 * 1000)

        const request4RuntimeMs = request4EndTime - request4StartTime
        expect(request4RuntimeMs).toBeLessThanOrEqual(1000)
    }, 60 * 1000)
})


const waitFor = (n) => ({
    milliseconds: async () => await new Promise(resolve => setTimeout(resolve, n)),
    seconds: async () => await new Promise(resolve => setTimeout(resolve, n * 1000))
})