import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp, defineRoute, $clearRoutes } from '../../index.js'

describe('Basic routing', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should return 200 with expected response', async () => {
    defineRoute({
      method: 'get',
      path: '/hello',
      handler: async () => {
        return { message: 'hello world' }
      },
    })

    const app = await createApp()
    const res = await request(app).get('/hello')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'hello world' })
  })

  it('should handle route without method as GET', async () => {
    defineRoute({
      path: '/health',
      handler: async () => {
        return { status: 'ok' }
      },
    })

    const app = await createApp()
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('should handle query and params correctly', async () => {
    defineRoute({
      path: '/vendors/:vendorId/products',
      handler: async ({ req }) => {
        return {
          vendorId: req.params.vendorId,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
        }
      },
    })

    const app = await createApp()
    const res = await request(app).get(
      '/vendors/1001/products?page=2&limit=100'
    )

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ page: 2, limit: 100, vendorId: '1001' })
  })

  it('should handle request body correctly', async () => {
    defineRoute({
      path: '/vendors',
      method: 'post',
      handler: async ({ req }) => {
        return req.body
      },
    })

    const app = await createApp()
    const res = await request(app).post('/vendors').send({
      name: 'ABC Corp.',
      country: 'Canada',
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      name: 'ABC Corp.',
      country: 'Canada',
    })
  })

  it('should handle PUT request correctly', async () => {
    defineRoute({
      path: '/vendors/:id',
      method: 'put',
      handler: async () => {
        return { status: 'updated' }
      },
    })

    const app = await createApp()
    const res = await request(app).put('/vendors/100').send({
      name: 'ABC Corp.',
      country: 'Canada',
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'updated' })
  })

  it('should handle DELETE request correctly', async () => {
    defineRoute({
      path: '/vendors/:id',
      method: 'delete',
      handler: async () => {
        return { status: 'deleted' }
      },
    })

    const app = await createApp()
    const res = await request(app).delete('/vendors/100')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'deleted' })
  })

  it('should return 404 if no matching route', async () => {
    const app = await createApp()
    const res = await request(app).get('/wrong-route')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      status: 404,
      code: 'NOT_FOUND',
      message: 'No matching route.',
    })
  })

  it('should return 500 if handler throw an error', async () => {
    defineRoute({
      path: '/crash',
      handler: async () => {
        throw new Error('Oh no! It crashed!')
      },
    })

    const app = await createApp()
    const res = await request(app).get('/crash')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    })
  })

  it('should return internal error details in dev mode', async () => {
    defineRoute({
      path: '/crash',
      handler: async () => {
        throw new Error('Oh no! It crashed!')
      },
    })

    const app = await createApp({
      isDev: true,
    })
    const res = await request(app).get('/crash')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      data: {
        errorMessage: 'Oh no! It crashed!',
        stack: expect.stringContaining('Oh no! It crashed!'),
      },
    })
  })
})
