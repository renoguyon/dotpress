import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp, createRouteGroup, $clearRoutes } from '../../index.js'

describe('Group Routes', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should apply group prefix and middlewares to child routes', async () => {
    const log: string[] = []

    const mw1 = vi.fn(async () => {
      log.push('mw1')
    })
    const mw2 = vi.fn(async () => {
      log.push('mw2')
    })

    const adminGroup = createRouteGroup('/admin', [mw1])

    adminGroup.defineRoute({
      method: 'get',
      path: '/users',
      middlewares: [mw2],
      handler: async () => {
        log.push('route-handler')

        return [{ id: 1, name: 'root' }]
      },
    })

    const app = await createApp()

    const res = await request(app).get('/admin/users')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 1, name: 'root' }])
    expect(log).toEqual(['mw1', 'mw2', 'route-handler'])
  })

  it('should support nested groups', async () => {
    const log: string[] = []

    const mw1 = vi.fn(async () => {
      log.push('mw1')
    })
    const mw2 = vi.fn(async () => {
      log.push('mw2')
    })
    const mw3 = vi.fn(async () => {
      log.push('mw3')
    })

    const adminGroup = createRouteGroup('/admin', [mw1])
    const billingGroup = adminGroup.createGroup('/billing', [mw2])

    billingGroup.defineRoute({
      method: 'get',
      path: '/invoices',
      middlewares: [mw3],
      handler: async () => {
        log.push('invoice-handler')

        return [{ id: 1, amount: 100 }]
      },
    })

    const app = await createApp()

    const res = await request(app).get('/admin/billing/invoices')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 1, amount: 100 }])
    expect(log).toEqual(['mw1', 'mw2', 'mw3', 'invoice-handler'])
  })
})
