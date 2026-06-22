import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../common/config/env.validation';
import { sanitizeFileName } from '../../common/utils/file.utils';
import { SupabaseService } from '../../supabase/supabase.service';

const WASTE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const REPORT_MAX_BYTES = 20 * 1024 * 1024;
const DEFAULT_SIGNED_URL_EXPIRES_SEC = 3600;

const WASTE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export interface StorageUploadResult {
  path: string;
}

export interface InitBucketsResult {
  wasteImages: 'created' | 'exists';
  reports: 'created' | 'exists';
}

@Injectable()
export class StorageService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  getWasteImagesBucket(): string {
    return (
      this.configService.get('SUPABASE_STORAGE_BUCKET_WASTE_IMAGES', {
        infer: true,
      }) ?? 'waste-images'
    );
  }

  getReportsBucket(): string {
    return (
      this.configService.get('SUPABASE_STORAGE_BUCKET_REPORTS', {
        infer: true,
      }) ?? 'reports'
    );
  }

  async initBuckets(): Promise<InitBucketsResult> {
    const admin = this.supabaseService.getAdminClient();
    const wasteImagesBucket = this.getWasteImagesBucket();
    const reportsBucket = this.getReportsBucket();

    const wasteImages = await this.ensureBucket(admin, wasteImagesBucket, {
      public: false,
      fileSizeLimit: WASTE_IMAGE_MAX_BYTES,
      allowedMimeTypes: [...WASTE_IMAGE_MIME_TYPES],
    });

    const reports = await this.ensureBucket(admin, reportsBucket, {
      public: false,
      fileSizeLimit: REPORT_MAX_BYTES,
    });

    return { wasteImages, reports };
  }

  generateWasteImagePath(
    userId: string,
    listingId: string,
    originalName: string,
  ): string {
    const bucket = this.getWasteImagesBucket();
    const timestamp = Date.now();
    const sanitized = sanitizeFileName(originalName);

    return `${bucket}/${userId}/${listingId}/${timestamp}_${sanitized}`;
  }

  getObjectPathFromGeneratedPath(generatedPath: string): string {
    const bucket = this.getWasteImagesBucket();

    if (generatedPath.startsWith(`${bucket}/`)) {
      return generatedPath.slice(bucket.length + 1);
    }

    return generatedPath;
  }

  async uploadWasteImage(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<StorageUploadResult> {
    const bucket = this.getWasteImagesBucket();
    const objectPath = this.getObjectPathFromGeneratedPath(fileName);

    await this.uploadObject(bucket, objectPath, buffer, contentType);

    return {
      path: fileName.startsWith(`${bucket}/`)
        ? fileName
        : `${bucket}/${objectPath}`,
    };
  }

  async getSignedWasteImageUrl(
    path: string,
    expiresSec = DEFAULT_SIGNED_URL_EXPIRES_SEC,
  ): Promise<string> {
    const bucket = this.getWasteImagesBucket();
    const objectPath = this.getObjectPathFromGeneratedPath(path);

    return this.createSignedUrl(bucket, objectPath, expiresSec);
  }

  async deleteWasteImage(path: string): Promise<void> {
    const bucket = this.getWasteImagesBucket();
    const objectPath = this.getObjectPathFromGeneratedPath(path);
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.storage.from(bucket).remove([objectPath]);

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to delete waste image',
        code: 'STORAGE_DELETE_FAILED',
        details: error.message,
      });
    }
  }

  async uploadReport(
    buffer: Buffer,
    fileName: string,
    reportId: string,
  ): Promise<StorageUploadResult> {
    const bucket = this.getReportsBucket();
    const timestamp = Date.now();
    const sanitized = sanitizeFileName(fileName);
    const objectPath = `${reportId}/${timestamp}_${sanitized}`;

    return this.uploadObject(
      bucket,
      objectPath,
      buffer,
      this.guessContentType(fileName),
    );
  }

  async getSignedReportUrl(
    path: string,
    expiresSec = DEFAULT_SIGNED_URL_EXPIRES_SEC,
  ): Promise<string> {
    const bucket = this.getReportsBucket();

    return this.createSignedUrl(bucket, path, expiresSec);
  }

  private async ensureBucket(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    bucketName: string,
    options: {
      public: boolean;
      fileSizeLimit: number;
      allowedMimeTypes?: string[];
    },
  ): Promise<'created' | 'exists'> {
    const { data: buckets, error: listError } =
      await admin.storage.listBuckets();

    if (listError) {
      throw new InternalServerErrorException({
        error: 'Failed to list storage buckets',
        code: 'STORAGE_INIT_FAILED',
        details: listError.message,
      });
    }

    const exists = (buckets ?? []).some((bucket) => bucket.name === bucketName);

    if (exists) {
      return 'exists';
    }

    const { error: createError } = await admin.storage.createBucket(
      bucketName,
      {
        public: options.public,
        fileSizeLimit: options.fileSizeLimit,
        allowedMimeTypes: options.allowedMimeTypes,
      },
    );

    if (createError) {
      throw new InternalServerErrorException({
        error: `Failed to create storage bucket '${bucketName}'`,
        code: 'STORAGE_INIT_FAILED',
        details: createError.message,
      });
    }

    return 'created';
  }

  private async uploadObject(
    bucket: string,
    objectPath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<StorageUploadResult> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to upload file to storage',
        code: 'STORAGE_UPLOAD_FAILED',
        details: error.message,
      });
    }

    return { path: objectPath };
  }

  private async createSignedUrl(
    bucket: string,
    objectPath: string,
    expiresSec: number,
  ): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(objectPath, expiresSec);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException({
        error: 'Failed to create signed URL',
        code: 'STORAGE_SIGNED_URL_FAILED',
        details: error?.message ?? 'Signed URL missing from response',
      });
    }

    return data.signedUrl;
  }

  private guessContentType(fileName: string): string {
    const lower = fileName.toLowerCase();

    if (lower.endsWith('.pdf')) {
      return 'application/pdf';
    }

    if (lower.endsWith('.xlsx')) {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    if (lower.endsWith('.csv')) {
      return 'text/csv';
    }

    return 'application/octet-stream';
  }
}
