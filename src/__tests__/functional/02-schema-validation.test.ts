import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp, defineRoute, $clearRoutes } from '../../index.js'

describe('Schema Validation', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should return 400 Validation Error if request body is invalid', async () => {
    defineRoute({
      path: '/members',
      method: 'post',
      schema: (z) => ({
        body: z.object({
          name: z.string(),
          age: z.number(),
        }),
      }),
      handler: async () => {
        return { status: 'success' }
      },
    })

    const app = await createApp()
    const res = await request(app).post('/members').send({})

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      error: 'Validation failed',
      details: [
        {
          source: 'body',
          issues: [
            {
              code: 'invalid_type',
              expected: 'string',
              message: 'Required',
              path: ['name'],
              received: 'undefined',
            },
            {
              code: 'invalid_type',
              expected: 'number',
              message: 'Required',
              path: ['age'],
              received: 'undefined',
            },
          ],
        },
      ],
    })
  })

  it('should return 200 if schema is valid', async () => {
    defineRoute({
      path: '/members',
      method: 'post',
      schema: (z) => ({
        body: z.object({
          name: z.string(),
          age: z.number(),
        }),
      }),
      handler: async () => {
        return { status: 'success' }
      },
    })

    const app = await createApp()
    const res = await request(app).post('/members').send({
      name: 'Alice',
      age: 25,
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'success' })
  })

  it('should return 204 if response schema is set to never', async () => {
    defineRoute({
      path: '/members/:id',
      method: 'delete',
      schema: (z) => ({
        response: z.never(),
      }),
      handler: async () => {
        // Do something here
        // ...
        return
      },
    })

    const app = await createApp()
    const res = await request(app).delete('/members/123')

    expect(res.status).toBe(204)
    expect(res.body).toEqual({})
  })
})
