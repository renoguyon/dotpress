import type { Request, Response, Express } from 'express'
import type { ZodSchema, TypeOf } from 'zod'
import type { Logger } from 'pino'
import type { HttpError } from '../core/errors.js'

export type MulterFile = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string
      files?: Record<string, MulterFile[]>
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
  useBeforeRoutes?: (app: Express) => void
  useAfterRoutes?: (app: Express) => void
}

export type RouteMiddleware<
  TReq extends Request = Request,
  TRes extends Response = Response,
  TFile extends FileRules | undefined = undefined,
> = (ctx: RequestContext<TReq, TRes, TFile>) => Promise<void | HttpError>

export type FileValidation = {
  maxSize?: number
  mimeTypes?: string[]
  extensions?: string[]
}

export type RequestFiles<F extends FileRules = FileRules> =
  F extends Record<string, unknown>
    ? { [K in keyof F]: MulterFile[] }
    : Record<string, MulterFile[]>

export type RequestContext<
  TReq = Request,
  TRes = Response,
  TFile extends FileRules | undefined = undefined,
> = {
  req: TReq
  res: TRes
  logger: Logger
  requestId: string
  user: ContextType['user'] | undefined
  getFile: (
    name: TFile extends FileRules ? keyof TFile : string
  ) => MulterFile | undefined
}

export type AsyncHandler<
  TReq = Request,
  TRes = Response,
  TResult = unknown,
  TFile extends FileRules | undefined = undefined,
> = (ctx: RequestContext<TReq, TRes, TFile>) => Promise<TResult | HttpError>

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

export type FileRules = Record<string, FileValidation>

export type RouteDefinition<
  TResult = unknown,
  S extends ValidationSchema = ValidationSchema,
  TFile extends FileRules | undefined = undefined,
> = {
  path: string
  method?: 'get' | 'post' | 'put' | 'delete'
  handler: AsyncHandler<ExtractRequestType<S>, Response, TResult, TFile>
  schema?: SchemaFactory<S>
  middlewares?: RouteMiddleware<ExtractRequestType<S>>[]
  files?: TFile
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

export type RouteGroup = {
  defineRoute: <
    TResult = unknown,
    S extends ValidationSchema = ValidationSchema,
    TFile extends FileRules | undefined = undefined,
  >(
    routeConfig: RouteDefinition<TResult, S, TFile>
  ) => void
  createGroup: (prefix: string, middlewares?: RouteMiddleware[]) => RouteGroup
}
