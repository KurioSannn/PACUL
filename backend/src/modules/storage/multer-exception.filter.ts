import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'File is too large',
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: exception.message,
      code: 'FILE_UPLOAD_FAILED',
    });
  }
}
