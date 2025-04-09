import { Request, Response } from 'express'
import { ZodSchema, TypeOf } from 'zod'
import type { Logger } from 'pino'
import { HttpError } from '../core/errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string
      user?: unknown
    }
  }
}

type GetOrUnknown<T, K extends string> = K extends keyof T ? T[K] : unknown

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppTypes {
  // To be augmented by app
}

export type ContextType = {
  user: GetOrUnknown<AppTypes, 'user'>
}

export type AppOptions = {
  isDev?: boolean
  enableHttpLogging?: boolean
  cors?: {
    disable?: boolean
  }
  middlewares?: RouteMiddleware[]
  onException?: (err: unknown, req: Request) => void
  onRequestComplete?: (e: CompleteRequestEvent) => void
}

export type RouteMiddleware<
  TReq extends Request = Request,
  TRes extends Response = Response,
> = (ctx: RequestContext<TReq, TRes>) => Promise<void | HttpError>

export type RequestContext<TReq = Request, TRes = Response> = {
  req: TReq
  res: TRes
  logger: Logger
  requestId: string
  user: ContextType['user'] | undefined
}

export type AsyncHandler<TReq = Request, TRes = Response, TResult = unknown> = (
  ctx: RequestContext<TReq, TRes>
) => Promise<TResult | HttpError>

export type ValidationSchema = {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema | string[]
  response?: ZodSchema
}

export type SchemaFactory<S extends ValidationSchema = ValidationSchema> = (
  z: typeof import('zod')
) => S

export type ExtractRequestType<S extends ValidationSchema> = Request<
  S['params'] extends ZodSchema ? TypeOf<S['params']> : Record<string, string>,
  unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S['body'] extends ZodSchema ? TypeOf<S['body']> : any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S['query'] extends ZodSchema ? TypeOf<S['query']> : any
>

export type RouteDefinition<
  TResult = unknown,
  S extends ValidationSchema = ValidationSchema,
> = {
  path: string
  method?: 'get' | 'post' | 'put' | 'delete'
  handler: AsyncHandler<ExtractRequestType<S>, Response, TResult>
  schema?: SchemaFactory<S>
  middlewares?: RouteMiddleware<ExtractRequestType<S>>[]
}

export type CompleteRequestEvent = {
  requestId: string
  timestamp: string
  method: string
  path: string
  body: unknown
  query: unknown
  statusCode: number
  durationMs: number
}
