import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createApp,
  defineRoute,
  $clearRoutes,
  $clearResponseFilters,
  registerResponseFilter,
} from '../../index.js'

describe('Filters', () => {
  beforeEach(() => {
    $clearRoutes()
    $clearResponseFilters()
  })

  describe('Response Filters', () => {
    it('should modify the handler response', async () => {
      registerResponseFilter((_ctx, result) => {
        return { wrapped: true, original: result }
      })

      defineRoute({
        method: 'get',
        path: '/test',
        handler: async () => ({ message: 'hello' }),
      })

      const app = await createApp()

      const res = await request(app).get('/test')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        wrapped: true,
        original: { message: 'hello' },
      })
    })

    it('should apply multiple filters in defined order', async () => {
      const log: string[] = []

      registerResponseFilter((_ctx, result) => {
        log.push('filter-1')
        return { wrapped: true, original: result }
      })

      registerResponseFilter((_ctx, result) => {
        log.push('filter-2')
        return { ...(result || {}), requestId: '123-456' }
      })

      defineRoute({
        method: 'get',
        path: '/test',
        handler: async () => {
          log.push('handler')
          return { message: 'hello' }
        },
      })

      const app = await createApp()

      const res = await request(app).get('/test')

      expect(log).toEqual(['handler', 'filter-1', 'filter-2'])
      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        wrapped: true,
        requestId: '123-456',
        original: { message: 'hello' },
      })
    })
  })
})
