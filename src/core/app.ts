import express, {
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { getAllRoutes } from './routes.js'
import type { AppOptions, RouteDefinition } from '../types/types.js'
import { wrapHandler } from './handlers.js'
import { buildValidationMiddleware } from '../middlewares/validation.js'
import z, { ZodSchema } from 'zod'
import { setupBaseMiddlewares } from '../middlewares/base-middlewares.js'

export const createApp = async (options: AppOptions = {}) => {
  const app = express()
  app.use(express.json())

  await setupBaseMiddlewares(app, options)

  const router = express.Router()
  const globalMiddlewares = options?.middlewares ?? []

  if (options.useBeforeRoutes) {
    options.useBeforeRoutes(app)
  }

  const routes: RouteDefinition[] = getAllRoutes()

  routes.forEach(
    ({ method = 'get', path, handler, schema, middlewares = [] }) => {
      const handlers: RequestHandler[] = []
      let responseSchema: ZodSchema | undefined

      if (schema) {
        const resolvedSchema = schema(z)
        if (resolvedSchema.response) {
          responseSchema = resolvedSchema.response
        }
        handlers.push(buildValidationMiddleware(resolvedSchema))
      }

      handlers.push(
        wrapHandler(
          handler,
          responseSchema,
          [...globalMiddlewares, ...middlewares],
          options
        )
      )

      router[method](path, ...handlers)
    }
  )

  app.use(router)

  app.use((_req, res) => {
    res.status(404).json({
      status: 404,
      code: 'NOT_FOUND',
      message: 'No matching route.',
    })
  })

  if (options.useAfterRoutes) {
    options.useAfterRoutes(app)
  }

  // Global error handler
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err)
    }

    if (typeof options.onException === 'function') {
      options.onException(err, req)
    }

    const data = options?.isDev
      ? {
          errorMessage: (err as Record<string, unknown>).message || undefined,
          stack: (err as Record<string, unknown>).stack || undefined,
        }
      : undefined

    res.status(500).json({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      data,
    })
  })

  return app
}
