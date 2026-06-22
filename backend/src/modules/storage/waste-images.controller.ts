import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { EnvironmentVariables } from '../../common/config/env.validation';
import type { AuthUser } from '../../common/types/auth-user';
import {
  getFileSizeMB,
  validateFileSize,
  validateFileType,
} from '../../common/utils/file.utils';
import { StorageService } from './storage.service';
import { MulterExceptionFilter } from './multer-exception.filter';
import {
  assertWasteImageOwnership,
  detectImageMimeType,
  hasPathTraversalInFileName,
  parseAllowedMimeTypes,
} from './waste-image.validation';

const UPLOAD_MAX_BYTES =
  Number(process.env.AI_MAX_FILE_SIZE_MB ?? 5) * 1024 * 1024;
const SIGNED_URL_EXPIRES_SEC = 3600;

@Controller('waste-images')
@UseFilters(MulterExceptionFilter)
export class WasteImagesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: UPLOAD_MAX_BYTES,
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException({
        error: 'Image file is required in multipart field "image"',
        code: 'FILE_REQUIRED',
      });
    }

    const maxMb =
      this.configService.get('AI_MAX_FILE_SIZE_MB', { infer: true }) ?? 5;
    const allowedMimeTypes = parseAllowedMimeTypes(
      this.configService.get('AI_ALLOWED_MIME_TYPES', { infer: true }) ??
        'image/jpeg,image/png,image/webp',
    );

    const multerLimitBytes = maxMb * 1024 * 1024;
    if (file.size > multerLimitBytes) {
      throw new BadRequestException({
        error: `File is too large. Maximum size is ${maxMb}MB (received ${getFileSizeMB(file.size)}MB)`,
        code: 'FILE_TOO_LARGE',
      });
    }

    if (!validateFileSize(file.size, maxMb)) {
      throw new BadRequestException({
        error: `File is too large. Maximum size is ${maxMb}MB`,
        code: 'FILE_TOO_LARGE',
      });
    }

    if (hasPathTraversalInFileName(file.originalname)) {
      throw new BadRequestException({
        error: 'File name contains invalid path characters',
        code: 'INVALID_FILE_NAME',
      });
    }

    if (file.originalname.length > 255) {
      throw new BadRequestException({
        error: 'File name exceeds maximum length of 255 characters',
        code: 'INVALID_FILE_NAME',
      });
    }

    const declaredMime = file.mimetype.trim().toLowerCase();

    if (!validateFileType(declaredMime, allowedMimeTypes)) {
      throw new BadRequestException({
        error: `File type '${file.mimetype}' is not allowed`,
        code: 'INVALID_FILE_TYPE',
      });
    }

    const detectedMime = detectImageMimeType(file.buffer);

    if (!detectedMime || !allowedMimeTypes.includes(detectedMime)) {
      throw new BadRequestException({
        error: 'File content is not a supported image type',
        code: 'INVALID_FILE_TYPE',
      });
    }

    if (detectedMime !== declaredMime) {
      throw new BadRequestException({
        error: 'File content does not match the declared image type',
        code: 'INVALID_FILE_TYPE',
      });
    }

    const generatedPath = this.storageService.generateWasteImagePath(
      user.id,
      'temp',
      file.originalname,
    );

    const { path } = await this.storageService.uploadWasteImage(
      file.buffer,
      generatedPath,
      detectedMime,
    );

    const signedUrl = await this.storageService.getSignedWasteImageUrl(
      path,
      SIGNED_URL_EXPIRES_SEC,
    );

    return {
      path,
      signedUrl,
      expiresAt: this.buildExpiresAt(SIGNED_URL_EXPIRES_SEC),
    };
  }

  @Get('signed-url')
  async getSignedUrl(
    @Query('path') path: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!path?.trim()) {
      throw new BadRequestException({
        error: 'Query parameter "path" is required',
        code: 'PATH_REQUIRED',
      });
    }

    assertWasteImageOwnership(
      path,
      user.id,
      this.storageService.getWasteImagesBucket(),
    );

    const signedUrl = await this.storageService.getSignedWasteImageUrl(
      path,
      SIGNED_URL_EXPIRES_SEC,
    );

    return {
      signedUrl,
      expiresAt: this.buildExpiresAt(SIGNED_URL_EXPIRES_SEC),
    };
  }

  private buildExpiresAt(expiresSec: number): string {
    return new Date(Date.now() + expiresSec * 1000).toISOString();
  }
}
