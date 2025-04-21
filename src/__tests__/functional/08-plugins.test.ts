import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import {
  createApp,
  $clearRoutes,
  Plugin,
  defineRoute,
  $clearResponseFilters,
} from '../../index.js'

describe('Plugins', () => {
  beforeEach(() => {
    $clearRoutes()
    $clearResponseFilters()
  })

  it('should be able to declare routes', async () => {
    const testPlugin: Plugin = ({ addRoute }) => {
      addRoute({
        path: '/hello',
        handler: async () => {
          return { msg: 'Hello world' }
        },
      })
    }

    const app = await createApp({
      plugins: [testPlugin],
    })

    const res = await request(app).get('/hello')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ msg: 'Hello world' })
  })

  it('should be able to register a response filter', async () => {
    const testPlugin: Plugin = (api) => {
      api.addResponseFilter((_ctx, result) => {
        return { wrapped: true, result }
      })
    }

    defineRoute({
      path: '/status',
      handler: async () => {
        return {
          status: 'ok',
        }
      },
    })

    const app = await createApp({
      plugins: [testPlugin],
    })

    const res = await request(app).get('/status')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ wrapped: true, result: { status: 'ok' } })
  })

  it('should be able to declare useBeforeRoutes and useAfterRoutes hooks', async () => {
    const log: string[] = []

    const testPlugin: Plugin = (api) => {
      api.useBeforeRoutes((app) => {
        app.use((req, res, next) => {
          log.push('before-hook')
          next()
        })
      })

      api.useAfterRoutes((app) => {
        app.use(
          (
            _error: unknown,
            _req: Request,
            _res: Response,
            next: NextFunction
          ) => {
            log.push('after-hook')
            next()
          }
        )
      })
    }

    defineRoute({
      path: '/status',
      handler: async () => {
        log.push('handler')
        throw new Error()
      },
    })

    const app = await createApp({
      plugins: [testPlugin],
    })

    await request(app).get('/status')
    expect(log).toEqual(['before-hook', 'handler', 'after-hook'])
  })

  it('should be able to declare global middlewares', async () => {
    const log: string[] = []

    defineRoute({
      method: 'get',
      path: '/hello',
      handler: async () => {
        log.push('route-handler')
        return { message: 'Hello!' }
      },
    })

    const testPlugin: Plugin = (api) => {
      const pluginMiddleware = vi.fn(async () => {
        log.push('plugin-middleware')
      })

      api.addGlobalMiddleware(pluginMiddleware)
    }

    const app = await createApp({
      plugins: [testPlugin],
    })

    const res = await request(app).get('/hello')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Hello!' })
    expect(log).toEqual(['plugin-middleware', 'route-handler'])
  })

  it('should be able to register route groups', async () => {
    const testPlugin: Plugin = (api) => {
      const group = api.addGroup('/my-plugin')
      group.defineRoute({
        path: '/status',
        handler: async () => {
          return {
            status: 'installed',
          }
        },
      })
    }

    const app = await createApp({
      plugins: [testPlugin],
    })

    const res = await request(app).get('/my-plugin/status')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'installed' })
  })
})
