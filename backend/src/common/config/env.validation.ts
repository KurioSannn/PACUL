import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';

const toBoolean = (value: unknown): boolean =>
  value === true || value === 'true';

const ENV_DEFAULTS: Record<string, string | number | boolean> = {
  AI_MODEL_PATH: './models/waste_classifier.onnx',
  AI_MODEL_VERSION: '1.0.0',
  AI_USE_MOCK_CLASSIFIER: true,
  AI_MAX_FILE_SIZE_MB: 5,
  AI_ALLOWED_MIME_TYPES: 'image/jpeg,image/png,image/webp',
  AI_INFERENCE_TIMEOUT_MS: 10000,
  AI_TOP_K_PREDICTIONS: 3,
  ROUTE_BASE_FEE: 5000,
  ROUTE_COST_PER_KM: 2000,
  ROUTE_HANDLING_COST_PER_KG: 300,
  SUPABASE_STORAGE_BUCKET_WASTE_IMAGES: 'waste-images',
  SUPABASE_STORAGE_BUCKET_REPORTS: 'reports',
  SUPABASE_REALTIME_ENABLED: true,
  REPORT_EXPORT_EXPIRES_HOURS: 24,
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  RATE_LIMIT_GLOBAL_PER_MINUTE: 120,
  RATE_LIMIT_AI_PER_MINUTE: 10,
  RATE_LIMIT_REPORT_EXPORT_PER_HOUR: 3,
  NODE_ENV: 'development',
  PORT: 4000,
  APP_LOG_LEVEL: 'info',
  DEMO_SEED_ENABLED: true,
};

export class EnvironmentVariables {
  @IsNotEmpty({ message: 'SUPABASE_URL is required' })
  @IsString()
  SUPABASE_URL!: string;

  @IsNotEmpty({ message: 'SUPABASE_ANON_KEY is required' })
  @IsString()
  SUPABASE_ANON_KEY!: string;

  @IsNotEmpty({ message: 'SUPABASE_SERVICE_ROLE_KEY is required' })
  @IsString()
  SUPABASE_SERVICE_ROLE_KEY!: string;

  @IsNotEmpty({ message: 'SUPABASE_JWT_SECRET is required' })
  @IsString()
  SUPABASE_JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  AI_MODEL_PATH?: string;

  @IsOptional()
  @IsString()
  AI_MODEL_VERSION?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  AI_USE_MOCK_CLASSIFIER?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  AI_MAX_FILE_SIZE_MB?: number;

  @IsOptional()
  @IsString()
  AI_ALLOWED_MIME_TYPES?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  AI_INFERENCE_TIMEOUT_MS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  AI_TOP_K_PREDICTIONS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ROUTE_BASE_FEE?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ROUTE_COST_PER_KM?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ROUTE_HANDLING_COST_PER_KG?: number;

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_BUCKET_WASTE_IMAGES?: string;

  @IsOptional()
  @IsString()
  SUPABASE_STORAGE_BUCKET_REPORTS?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  SUPABASE_REALTIME_ENABLED?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  REPORT_EXPORT_EXPIRES_HOURS?: number;

  @IsOptional()
  @IsString()
  CORS_ALLOWED_ORIGINS?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  RATE_LIMIT_GLOBAL_PER_MINUTE?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  RATE_LIMIT_AI_PER_MINUTE?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  RATE_LIMIT_REPORT_EXPORT_PER_HOUR?: number;

  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  PORT?: number;

  @IsOptional()
  @IsIn(['error', 'warn', 'info', 'debug', 'verbose'])
  APP_LOG_LEVEL?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  DEMO_SEED_ENABLED?: boolean;
}

function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .flatMap((error) => {
      if (error.constraints) {
        return Object.values(error.constraints);
      }
      if (error.children?.length) {
        return formatValidationErrors(error.children).split('\n  - ');
      }
      return [`${error.property}: invalid value`];
    })
    .join('\n  - ');
}

function applyDefaults(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...config };

  for (const [key, defaultValue] of Object.entries(ENV_DEFAULTS)) {
    const current = merged[key];
    if (current === undefined || current === '') {
      merged[key] = defaultValue;
    }
  }

  return merged;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const merged = applyDefaults(config);

  const validated = plainToInstance(EnvironmentVariables, merged, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n  - ${formatValidationErrors(errors)}`,
    );
  }

  return validated;
}
