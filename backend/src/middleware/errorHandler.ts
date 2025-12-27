import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

// Optional Sentry import (only if DSN is configured)
let Sentry: any = null;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'your-sentry-dsn-here') {
  try {
    Sentry = require('@sentry/node');
  } catch {
    // Sentry not installed or failed to load
  }
}

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;
  const userId = (req as any).user?.id;

  // Determine status code
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error with context
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    requestId,
    userId,
    method: req.method,
    path: req.path,
    statusCode,
    isOperational,
  });

  // Send to Sentry for non-operational errors (unexpected errors)
  if (!isOperational && Sentry) {
    Sentry.captureException(err, {
      tags: {
        requestId,
        userId,
      },
      extra: {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
      },
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    requestId,
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

