import { NextResponse } from 'next/server';

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Capture stack trace if available (Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Authentication error for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * External service error for third-party API failures
 */
export class ExternalServiceError extends AppError {
  service: string;

  constructor(service: string, message: string) {
    super(`[${service}] ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Rate limit error for API quota exceeded
 */
export class RateLimitError extends AppError {
  service: string;
  retryAfter?: number;

  constructor(service: string, message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(`[${service}] ${message}`, 429, 'RATE_LIMIT_ERROR');
    this.service = service;
    this.retryAfter = retryAfter;
  }
}

/**
 * Quota exceeded error for Google API
 */
export class QuotaExceededError extends AppError {
  service: string;

  constructor(service: string, message: string = 'API quota exceeded') {
    super(`[${service}] ${message}`, 429, 'QUOTA_EXCEEDED');
    this.service = service;
  }
}

/**
 * Handles errors and returns appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known error types
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    };

    // Add service-specific details
    if (error instanceof ExternalServiceError || error instanceof RateLimitError || error instanceof QuotaExceededError) {
      response.service = error.service;
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Google API errors (from googleapis library)
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Check for Google API specific errors
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('user rate limit')) {
      return NextResponse.json(
        {
          error: 'Google API quota exceeded. Please try again later.',
          code: 'QUOTA_EXCEEDED',
          service: 'Google',
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again in a moment.',
          code: 'RATE_LIMIT_ERROR',
          service: 'Google',
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes('invalid credentials') || errorMessage.includes('unauthorized')) {
      return NextResponse.json(
        {
          error: 'Authentication expired. Please reconnect your Google account.',
          code: 'AUTHENTICATION_ERROR',
        },
        { status: 401 }
      );
    }

    if (errorMessage.includes('insufficient permission') || errorMessage.includes('permission denied')) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions. Please grant the required access.',
          code: 'PERMISSION_ERROR',
          service: 'Google',
        },
        { status: 403 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  console.error('Unknown error type:', error);
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

