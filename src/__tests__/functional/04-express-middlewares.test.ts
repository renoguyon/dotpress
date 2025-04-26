import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp, defineRoute, $clearRoutes } from '../../index.js'
import { NextFunction } from 'express'

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

  it('should call useBeforeRoutes and useAfterRoutes at the correct time', async () => {
    defineRoute({
      path: '/crash',
      handler: async () => {
        callOrder.push('route-handler')
        throw new Error('Oh no! It crashed!')
      },
    })

    const callOrder: string[] = []

    const useBeforeRoutes = vi.fn((app) => {
      app.use((_req: Request, _res: Response, next: NextFunction) => {
        callOrder.push('before-routes-middleware')
        next()
      })
    })

    const useAfterRoutes = vi.fn((app) => {
      app.use(
        (err: unknown, _req: Request, _res: Response, next: NextFunction) => {
          callOrder.push('after-routes-middleware')
          next(err)
        }
      )
    })

    const app = await createApp({
      useBeforeRoutes,
      useAfterRoutes,
    })

    await request(app).get('/crash')

    expect(useBeforeRoutes).toHaveBeenCalledTimes(1)
    expect(useAfterRoutes).toHaveBeenCalledTimes(1)

    expect(callOrder).toEqual([
      'before-routes-middleware',
      'route-handler',
      'after-routes-middleware',
    ])
  })

  describe('CORS', () => {
    it('should enable cors by default', async () => {
      defineRoute({
        method: 'get',
        path: '/hello',
        handler: async ({ requestId }) => {
          return { requestId: requestId }
        },
      })

      const app = await createApp()
      const res = await request(app).options('/hello')

      expect(res.status).toBe(204)

      expect(res.headers['access-control-allow-origin']).toBe('*')
      expect(res.headers['access-control-allow-methods']).toBe(
        'GET,HEAD,PUT,PATCH,POST,DELETE'
      )
      expect(res.headers['access-control-allow-headers']).toBe(
        'Origin,X-Requested-With,Content-Type,Accept,Authorization'
      )
    })

    it('should be able to disable cors', async () => {
      defineRoute({
        method: 'get',
        path: '/hello',
        handler: async ({ requestId }) => {
          return { requestId: requestId }
        },
      })

      const app = await createApp({
        cors: false,
      })
      const res = await request(app).options('/hello')

      expect(res.status).toBe(200)

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
      expect(res.headers['access-control-allow-methods']).toBeUndefined()
      expect(res.headers['access-control-allow-headers']).toBeUndefined()
    })

    it('should be able to customize cors settings', async () => {
      defineRoute({
        method: 'get',
        path: '/hello',
        handler: async ({ requestId }) => {
          return { requestId: requestId }
        },
      })

      const app = await createApp({
        cors: {
          allowedHeaders: ['content-type'],
          methods: ['GET', 'PUT', 'POST', 'DELETE'],
          origin: ['https://example.com'],
        },
      })

      const res = await request(app)
        .options('/hello')
        .set('origin', 'https://example.com')

      expect(res.status).toBe(204)

      expect(res.headers['access-control-allow-origin']).toBe(
        'https://example.com'
      )
      expect(res.headers['access-control-allow-methods']).toBe(
        'GET,PUT,POST,DELETE'
      )
      expect(res.headers['access-control-allow-headers']).toBe('content-type')
    })

    it('should not allow origin if host does not match', async () => {
      defineRoute({
        method: 'get',
        path: '/hello',
        handler: async ({ requestId }) => {
          return { requestId: requestId }
        },
      })

      const app = await createApp({
        cors: {
          origin: ['https://example.com'],
        },
      })

      const res = await request(app)
        .options('/hello')
        .set('origin', 'https://example.net')

      expect(res.status).toBe(204)

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
  })
})
