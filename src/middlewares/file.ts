import path from 'path'
import type { RequestHandler } from 'express'
import type { FileValidation } from '../types/types.js'
import type { Multer } from 'multer'

export const getMulterInstance = async (): Promise<Multer | undefined> => {
  try {
    const { default: multer } = await import('multer')
    return multer({ storage: multer.memoryStorage() })
  } catch {
    return undefined
  }
}

export const buildFileValidationMiddleware = (
  rules: Record<string, FileValidation>
): RequestHandler => {
  return (req, res, next) => {
    const errors: Array<Record<string, unknown>> = []

    for (const field in rules) {
      const file = req.files?.[field]?.[0] as Express.Multer.File
      const rule = rules[field]
      if (!file) continue

      if (rule.maxSize && file.size > rule.maxSize) {
        errors.push({
          field,
          issue: 'File too large',
          maxSize: rule.maxSize,
          received: file.size,
        })
      }
      if (rule.mimeTypes && !rule.mimeTypes.includes(file.mimetype)) {
        errors.push({
          field,
          issue: 'Invalid mimetype',
          expected: rule.mimeTypes,
          received: file.mimetype,
        })
      }
      if (
        rule.extensions &&
        !rule.extensions.includes(path.extname(file.originalname))
      ) {
        errors.push({
          field,
          issue: 'Invalid extension',
          expected: rule.extensions,
          received: path.extname(file.originalname),
        })
      }
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: 'Invalid file upload', details: errors })
    }

    next()
  }
}
