import { RequestHandler, Request, Response } from 'express'
import {
  AppOptions,
  AsyncHandler,
  CompleteRequestEvent,
  FileRules,
  RequestContext,
  RouteMiddleware,
} from '../types/types.js'
import { HttpError } from './errors.js'
import { ZodSchema, ZodNever } from 'zod'
import { Logger } from 'pino'

export const wrapHandler = <
  TReq extends Request = Request,
  TRes extends Response = Response,
  TFile extends FileRules | undefined = undefined,
>(
  fn: AsyncHandler<TReq, TRes, unknown, TFile>,
  responseSchema?: ZodSchema,
  middlewares: RouteMiddleware<TReq, TRes, TFile>[] = [],
  options: AppOptions = {}
): RequestHandler => {
  return async (req, res, next) => {
    // TODO: refactor logger injection
    let logger: unknown = console

    try {
      const { pino } = await import('pino')
      logger = pino()
    } catch {
      // Nothing to do here
    }

    const ctx: RequestContext<TReq, TRes, TFile> = {
      req: req as TReq,
      res: res as TRes,
      logger: logger as Logger,
      requestId: req.id || '',
      user: req.user ? req.user : undefined,
      getFile: (name) => {
        const files = req.files?.[name as string]
        return Array.isArray(files) ? files[0] : undefined
      },
    } as RequestContext<TReq, TRes, TFile>

    const requestStart = new Date()

    res.on('finish', () => {
      if (typeof options.onRequestComplete === 'function') {
        const duration = Date.now() - requestStart.getTime()

        const event: CompleteRequestEvent = {
          requestId: String(req.id),
          timestamp: requestStart.toISOString(),
          method: req.method.toUpperCase(),
          path: req.path,
          body: req.body,
          query: req.query,
          statusCode: res.statusCode,
          durationMs: duration,
        }

        options.onRequestComplete(event)
      }
    })

    try {
      for (const mw of middlewares) {
        const output = await mw(ctx)

        if (output instanceof HttpError) {
          return returnErrorResponse(res, output)
        }
      }

      const result = await fn(ctx)

      if (result !== undefined) {
        if (result instanceof HttpError) {
          return returnErrorResponse(res, result)
        } else if (responseSchema) {
          return returnValidatedResponse(res, responseSchema, result)
        } else {
          return res.json(result)
        }
      } else if (responseSchema instanceof ZodNever) {
        return res.status(204).send()
      }
    } catch (err) {
      next(err)
    }
  }
}

const returnErrorResponse = <TRes extends Response = Response>(
  res: TRes,
  result: HttpError
): void => {
  res.status(result.status).json({
    status: result.status,
    error: result.code,
    message: result.message,
    data: result.data ? { ...result.data } : undefined,
  })
}

const returnValidatedResponse = <TRes extends Response = Response>(
  res: TRes,
  responseSchema: ZodSchema,
  result: unknown
): TRes => {
  if (responseSchema instanceof ZodNever) {
    // 204 No Content
    return res.status(204).send()
  }

  const validatedResponse = responseSchema.parse(result)
  return res.json(validatedResponse)
}
