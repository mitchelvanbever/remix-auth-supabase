import { installGlobals } from '@remix-run/node'

import { server } from '../mocks/server'

installGlobals()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
