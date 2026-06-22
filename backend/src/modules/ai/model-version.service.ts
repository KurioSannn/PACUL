import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

export interface AiModelVersionRow {
  id: string;
  version_string: string;
  model_type: string;
  description: string | null;
  taxonomy_version: string | null;
  is_active: boolean;
  deployed_at: string | null;
  deprecated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActiveModelVersion {
  version: string;
  model_type: string;
  taxonomy_version: string | null;
  deployed_at: string | null;
}

@Injectable()
export class ModelVersionService {
  private readonly logger = new Logger('ModelVersionService');
  private cachedActive: AiModelVersionRow | null = null;
  private cacheLoaded = false;

  constructor(private readonly supabaseService: SupabaseService) {}

  async getActiveModelVersionRow(): Promise<AiModelVersionRow | null> {
    if (this.cacheLoaded) {
      return this.cachedActive;
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('ai_model_versions')
      .select(
        'id, version_string, model_type, description, taxonomy_version, is_active, deployed_at, deprecated_at, metadata, created_at',
      )
      .eq('is_active', true)
      .order('deployed_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle<AiModelVersionRow>();

    if (error) {
      this.logger.error(
        `Failed to load active AI model version: ${error.message}`,
      );
      return null;
    }

    this.cachedActive = data ?? null;
    this.cacheLoaded = true;

    return this.cachedActive;
  }

  async getActiveModelVersionId(): Promise<string | null> {
    const row = await this.getActiveModelVersionRow();
    return row?.id ?? null;
  }

  async getActiveModelVersion(): Promise<ActiveModelVersion | null> {
    const row = await this.getActiveModelVersionRow();

    if (!row) {
      return null;
    }

    return {
      version: row.version_string,
      model_type: row.model_type,
      taxonomy_version: row.taxonomy_version,
      deployed_at: row.deployed_at,
    };
  }

  /** Clears the cached active version (useful after model deployment changes). */
  invalidateCache(): void {
    this.cachedActive = null;
    this.cacheLoaded = false;
  }
}
