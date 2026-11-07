import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp, defineRoute, $clearRoutes } from '../../index.js'
import type { AppOptions } from '../../index.js'

/**
 * TDD (RED) — these tests document a real bug reported by a consumer project.
 *
 * When a handler writes the response itself and RETURNS the `res` object
 * (e.g. `return res.status(200).json(...)`, `return res.send(buffer)`),
 * `wrapHandler` treats the returned `res` as a business result and calls
 * `res.json(res)` again on the already-sent response, producing a server-side
 * `TypeError: Converting circular structure to JSON`.
 *
 * The HTTP response the client receives is already flushed at that point, so a
 * black-box status/body assertion is NOT enough to catch the crash — we must
 * observe the server-side exception. We do so with an error-capturing
 * middleware and assert that no error leaked.
 */

// Builds an app that records any error propagated through the Express error
// pipeline, so we can assert the request produced no server-side exception.
const createAppWithErrorSpy = async (extra: AppOptions = {}) => {
  const errors: unknown[] = []

  const app = await createApp({
    ...extra,
    useAfterRoutes: (app) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      app.use((err: any, _req: any, _res: any, next: any) => {
        errors.push(err)
        next(err)
      })
    },
  })

  return { app, errors }
}

describe('Custom / manual responses', () => {
  beforeEach(() => {
    $clearRoutes()
  })

  it('should support returning res.status(200).json(...)', async () => {
    defineRoute({
      path: '/custom-json',
      handler: async ({ res }) => {
        return res.status(200).json({ a: 1 })
      },
    })

    const { app, errors } = await createAppWithErrorSpy()
    const res = await request(app).get('/custom-json')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ a: 1 })
    expect(errors).toEqual([])
  })

  it('should support returning res.status(204).json(null)', async () => {
    defineRoute({
      path: '/custom-204',
      handler: async ({ res }) => {
        return res.status(204).json(null)
      },
    })

    const { app, errors } = await createAppWithErrorSpy()
    const res = await request(app).get('/custom-204')

    expect(res.status).toBe(204)
    expect(errors).toEqual([])
  })

  it('should support returning a raw buffer via res.send()', async () => {
    const pdf = Buffer.from('%PDF-1.4 fake pdf content')

    defineRoute({
      path: '/return-buffer',
      handler: async ({ res }) => {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="doc.pdf"')
        return res.status(200).send(pdf)
      },
    })

    const { app, errors } = await createAppWithErrorSpy()
    const res = await request(app).get('/return-buffer').buffer(true)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('doc.pdf')
    expect(errors).toEqual([])
  })

  it('should support writing to res manually and returning nothing (PDF stream case)', async () => {
    const pdf = Buffer.from('%PDF-1.4 fake pdf content')

    defineRoute({
      path: '/invoice.pdf',
      handler: async ({ res }) => {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"')
        res.status(200).send(pdf)
        return
      },
    })

    const { app, errors } = await createAppWithErrorSpy()
    const res = await request(app).get('/invoice.pdf').buffer(true)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('invoice.pdf')
    expect(errors).toEqual([])
  })
})
