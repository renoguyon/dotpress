import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import {
  createApp,
  defineRoute,
  $clearRoutes,
  forbiddenError,
} from '../../index.js'

describe('App Middlewares', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  describe('Global Middlewares', () => {
    it('should execute global middlewares', async () => {
      defineRoute({
        method: 'get',
        path: '/hello',
        handler: async () => {
          return { message: 'Hello!' }
        },
      })

      const globalMiddleware1 = vi.fn()
      const globalMiddleware2 = vi.fn()

      const app = await createApp({
        middlewares: [globalMiddleware1, globalMiddleware2],
      })

      const res = await request(app).get('/hello')

      expect(globalMiddleware1).toHaveBeenCalledTimes(1)
      expect(globalMiddleware2).toHaveBeenCalledTimes(1)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ message: 'Hello!' })
    })
  })

  describe('Route middlewares', () => {
    it('should execute route middlewares', async () => {
      const requireRoleMiddleware = vi.fn()

      defineRoute({
        method: 'get',
        path: '/hello',
        middlewares: [requireRoleMiddleware],
        handler: async () => {
          return { message: 'Hello!' }
        },
      })

      const app = await createApp()
      const res = await request(app).get('/hello')

      expect(requireRoleMiddleware).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ message: 'Hello!' })
    })

    it('should handle middlewares error', async () => {
      const requireRoleMiddleware = vi.fn().mockImplementation(() => {
        return forbiddenError()
      })

      defineRoute({
        method: 'get',
        path: '/hello',
        middlewares: [requireRoleMiddleware],
        handler: async () => {
          return { message: 'Hello!' }
        },
      })

      const app = await createApp()
      const res = await request(app).get('/hello')

      expect(requireRoleMiddleware).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(403)
    })

    it('should handle middlewares exceptions', async () => {
      const requireRoleMiddleware = vi.fn().mockImplementation(() => {
        throw new Error('Crashed!')
      })

      defineRoute({
        method: 'get',
        path: '/hello',
        middlewares: [requireRoleMiddleware],
        handler: async () => {
          return { message: 'Hello!' }
        },
      })

      const app = await createApp()
      const res = await request(app).get('/hello')

      expect(requireRoleMiddleware).toHaveBeenCalledTimes(1)
      expect(res.status).toBe(500)
      expect(res.body).toEqual({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      })
    })
  })
})
