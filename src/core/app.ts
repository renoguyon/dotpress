import express, {
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express'
import { getAllRoutes, defineRoute, createRouteGroup } from './routes.js'
import {
  AppOptions,
  HookFunction,
  RouteDefinition,
  RouteMiddleware,
} from '../types/types.js'
import { wrapHandler } from './handlers.js'
import { buildValidationMiddleware } from '../middlewares/validation.js'
import z, { ZodSchema } from 'zod'
import { setupBaseMiddlewares } from '../middlewares/base-middlewares.js'
import {
  buildFileValidationMiddleware,
  getMulterInstance,
} from '../middlewares/file.js'
import { registerResponseFilter } from './filters.js'

export const createApp = async (options: AppOptions = {}) => {
  const app = express()
  app.use(express.json())

  await setupBaseMiddlewares(app, options)

  const router = express.Router()
  const globalMiddlewares = options?.middlewares ?? []
  const beforeRouteHooks: HookFunction[] = []
  const afterRouteHooks: HookFunction[] = []

  for (const plugin of options?.plugins || []) {
    plugin({
      addRoute: (route) => defineRoute(route),
      addGroup: (prefix: string, middlewares: RouteMiddleware[] = []) =>
        createRouteGroup(prefix, middlewares),
      addGlobalMiddleware: (middleware) => {
        globalMiddlewares.push(middleware)
      },
      addResponseFilter: (filter) => registerResponseFilter(filter),
      useBeforeRoutes: (hook) => {
        beforeRouteHooks.push(hook)
      },
      useAfterRoutes: (hook) => {
        afterRouteHooks.push(hook)
      },
    })
  }

  if (options.useBeforeRoutes) {
    options.useBeforeRoutes(app)
  }

  for (const hook of beforeRouteHooks) {
    hook(app)
  }

  const routes: RouteDefinition[] = getAllRoutes()
  const upload = await getMulterInstance()

  routes.forEach(
    ({ method = 'get', path, handler, schema, middlewares = [], files }) => {
      const handlers: RequestHandler[] = []
      let responseSchema: ZodSchema | undefined

      if (files) {
        if (!upload) {
          throw new Error("You need to install 'multer' to enable file upload.")
        }

        const fileNames = Array.isArray(files) ? files : Object.keys(files)
        const fileFields = fileNames.map((name) => ({ name, maxCount: 1 }))
        handlers.push(upload.fields(fileFields))

        if (!Array.isArray(files)) {
          handlers.push(buildFileValidationMiddleware(files))
        }
      }

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

  for (const hook of afterRouteHooks) {
    hook(app)
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
