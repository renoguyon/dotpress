import type { AppOptions } from '../types/types.js'
import type { Express } from 'express'
import { randomUUID } from 'crypto'

export const setupBaseMiddlewares = async (
  app: Express,
  options: AppOptions
) => {
  await useMorgan(app, options)
  useRequestId(app)
  useCors(app, options)
}

const useCors = (app: Express, options: AppOptions): void => {
  if (options.cors?.disable !== false) {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
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
