import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp, defineRoute, $clearRoutes } from '../../index.js'

describe('Express Middlewares', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should use a Request Id middleware', async () => {
    defineRoute({
      method: 'get',
      path: '/hello',
      handler: async ({ requestId }) => {
        return { requestId: requestId }
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    const uuidPattern =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ requestId: expect.stringMatching(uuidPattern) })
    expect(res.headers['x-request-id']).toStrictEqual(
      expect.stringMatching(uuidPattern)
    )
  })
})
