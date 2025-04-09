import { RequestHandler } from 'express'
import { ValidationSchema } from '../types/types.js'
import { ZodError, ZodSchema, ZodIssue } from 'zod'

export const buildValidationMiddleware = (
  schema: ValidationSchema
): RequestHandler => {
  return (req, res, next) => {
    const allErrors: {
      source: 'body' | 'query' | 'params'
      issues: ZodIssue[]
    }[] = []

    try {
      if (schema.body) {
        try {
          req.body = schema.body.parse(req.body)
        } catch (err) {
          if (err instanceof ZodError)
            allErrors.push({ source: 'body', issues: err.errors })
        }
      }

      if (schema.query) {
        try {
          req.query = schema.query.parse(req.query)
        } catch (err) {
          if (err instanceof ZodError)
            allErrors.push({ source: 'query', issues: err.errors })
        }
      }

      if (schema.params && Array.isArray(schema.params)) {
        // Just ensure keys exist (Express already guarantees this)
        for (const key of schema.params) {
          if (!(key in req.params)) {
            allErrors.push({
              source: 'params',
              issues: [
                { path: [key], message: 'Missing param', code: 'custom' },
              ],
            })
          }
        }
      } else if (schema.params && typeof schema.params === 'object') {
        try {
          req.params = (schema.params as ZodSchema).parse(req.params)
        } catch (err) {
          if (err instanceof ZodError)
            allErrors.push({ source: 'params', issues: err.errors })
        }
      }

      if (allErrors.length > 0) {
        return res
          .status(400)
          .json({ error: 'Validation failed', details: allErrors })
      }

      next()
    } catch (err) {
      return res
        .status(500)
        .json({ error: 'Validation middleware error', details: err })
    }
  }
}
