import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createApp,
  defineRoute,
  $clearRoutes,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  internalError,
} from '../../index.js'

describe('Error handling', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should return 400 Bad Request response', async () => {
    defineRoute({
      path: '/hello',
      handler: async () => {
        return badRequestError('Custom message here')
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      status: 400,
      error: 'BAD_REQUEST',
      message: 'Custom message here',
    })
  })

  it('should return 401 response', async () => {
    defineRoute({
      path: '/hello',
      handler: async () => {
        return unauthorizedError()
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      status: 401,
      error: 'UNAUTHORIZED',
      message: 'Unauthorized',
    })
  })

  it('should return 403 response', async () => {
    defineRoute({
      path: '/hello',
      handler: async () => {
        return forbiddenError()
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(403)
    expect(res.body).toEqual({
      status: 403,
      error: 'FORBIDDEN',
      message: 'Forbidden',
    })
  })

  it('should return 404 response', async () => {
    defineRoute({
      path: '/hello',
      handler: async () => {
        return notFoundError()
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      status: 404,
      error: 'NOT_FOUND',
      message: 'Not Found',
    })
  })

  it('should return 500 response', async () => {
    defineRoute({
      path: '/hello',
      handler: async () => {
        return internalError()
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      status: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    })
  })
})
