export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly data?: Record<string, unknown>
  ) {
    super(message)
  }
}

export const errorResponse = (
  status: number,
  code: string,
  message: string,
  data?: Record<string, unknown>
) => new HttpError(status, code, message, data)

export const badRequestError = (
  message = 'Bad Request',
  data?: Record<string, unknown>
) => errorResponse(400, 'BAD_REQUEST', message, data)

export const unauthorizedError = (
  message = 'Unauthorized',
  data?: Record<string, unknown>
) => errorResponse(401, 'UNAUTHORIZED', message, data)

export const forbiddenError = (
  message = 'Forbidden',
  data?: Record<string, unknown>
) => errorResponse(403, 'FORBIDDEN', message, data)

export const notFoundError = (
  message = 'Not Found',
  data?: Record<string, unknown>
) => errorResponse(404, 'NOT_FOUND', message, data)

export const internalError = (
  message = 'Internal Server Error',
  data?: Record<string, unknown>
) => errorResponse(500, 'INTERNAL_ERROR', message, data)
