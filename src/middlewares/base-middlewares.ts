import type { AppOptions } from '../types/types.js'
import type { Express, Request } from 'express'
import { randomUUID } from 'crypto'

export const setupBaseMiddlewares = async (
  app: Express,
  options: AppOptions
) => {
  useCors(app, options)
  await useMorgan(app, options)
  useRequestId(app)
}

const useCors = (app: Express, options: AppOptions): void => {
  if (options.cors !== false) {
    app.use((req, res, next) => {
      const corsOptions = options.cors || {}

      const getAllowedOrigin = (req: Request): string | undefined => {
        const requestOrigin = req.headers.origin

        if (corsOptions.origin && Array.isArray(corsOptions.origin)) {
          if (requestOrigin && corsOptions.origin.includes(requestOrigin)) {
            return requestOrigin
          } else {
            return undefined
          }
        }

        if (typeof corsOptions.origin === 'string') {
          return corsOptions.origin
        }

        return requestOrigin || '*'
      }

      const getAllowedMethods = (): string => {
        return (
          corsOptions?.methods ?? [
            'GET',
            'HEAD',
            'PUT',
            'PATCH',
            'POST',
            'DELETE',
          ]
        ).join(',')
      }

      const getAllowedHeaders = (): string => {
        return (
          corsOptions?.allowedHeaders ?? [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
          ]
        ).join(',')
      }

      const allowedOrign = getAllowedOrigin(req)

      if (allowedOrign) {
        res.header('Access-Control-Allow-Origin', allowedOrign)
      }

      res.header('Access-Control-Allow-Methods', getAllowedMethods())
      res.header('Access-Control-Allow-Headers', getAllowedHeaders())

      if (corsOptions?.credentials) {
        res.header('Access-Control-Allow-Credentials', 'true')
      }

      if (corsOptions?.exposedHeaders) {
        res.header(
          'Access-Control-Expose-Headers',
          corsOptions.exposedHeaders.join(',')
        )
      }

      if (corsOptions?.maxAge) {
        res.header('Access-Control-Max-Age', corsOptions.maxAge.toString())
      }

      if (req.method === 'OPTIONS') {
        return res.status(204).end()
      }
      next()
    })
  }
}

const useRequestId = (app: Express): void => {
  app.use((req, res, next) => {
    req.id = randomUUID()
    res.setHeader('X-Powered-By', 'dotpress.dev')
    res.setHeader('X-Request-ID', req.id)
    next()
  })
}

const useMorgan = async (app: Express, options: AppOptions): Promise<void> => {
  if (options.enableHttpLogging) {
    try {
      const morgan = await import('morgan')
      app.use(morgan.default('dev'))
    } catch {
      console.warn('Can not enable http logging: morgan is not installed.')
    }
  }
}
