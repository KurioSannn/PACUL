import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.normalizeException(exception);

    response.status(status).json(body);
  }

  private normalizeException(exception: unknown): {
    status: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          status,
          body: {
            success: false,
            error: exceptionResponse,
            code: this.codeFromStatus(status),
          },
        };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const payload = exceptionResponse as Record<string, unknown>;
        const message = payload.message;
        const error =
          typeof payload.error === 'string'
            ? payload.error
            : Array.isArray(message)
              ? message.join(', ')
              : typeof message === 'string'
                ? message
                : exception.message;

        const body: ApiErrorResponse = {
          success: false,
          error,
          code:
            typeof payload.code === 'string'
              ? payload.code
              : this.codeFromStatus(status),
        };

        if (Array.isArray(message)) {
          body.details = message;
        } else if (payload.details !== undefined) {
          body.details = payload.details;
        }

        return { status, body };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };
  }

  private codeFromStatus(status: number): string {
    if (status === 401) {
      return 'AUTH_REQUIRED';
    }
    if (status === 403) {
      return 'FORBIDDEN';
    }
    if (status === 404) {
      return 'NOT_FOUND';
    }
    if (status === 400) {
      return 'BAD_REQUEST';
    }
    if (status === 429) {
      return 'RATE_LIMITED';
    }
    return 'INTERNAL_ERROR';
  }
}
