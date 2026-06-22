import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { CompleteProfileDto } from './dto/complete-profile.dto';
import type { UpdateCollectorProfileDto } from './dto/update-collector-profile.dto';
import type { UpdateHouseholdProfileDto } from './dto/update-household-profile.dto';
import type { UpdateIndustryProfileDto } from './dto/update-industry-profile.dto';
import {
  mapCollectorProfileRow,
  mapHouseholdProfileRow,
  mapIndustryProfileRow,
  toCollectorProfileResponse,
  toHouseholdProfileResponse,
  toIndustryProfileResponse,
  toMeResponse,
  type CollectorProfileRow,
  type HouseholdProfileRow,
  type IndustryProfileRow,
  type UserProfileRow,
} from './profiles.mapper';
import type { MeResponse, UserRole } from './profiles.types';

type UpdateProfileDto =
  | UpdateHouseholdProfileDto
  | UpdateCollectorProfileDto
  | UpdateIndustryProfileDto;

@Injectable()
export class ProfilesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async resolveUserFromAuthorization(
    authorization?: string,
  ): Promise<{ id: string; email: string }> {
    const token = this.extractBearerToken(authorization);

    if (!token) {
      throw new UnauthorizedException({
        error: 'Authorization token is required',
        code: 'AUTH_REQUIRED',
      });
    }

    const user = await this.supabaseService.getUserFromToken(token);

    if (!user) {
      throw new UnauthorizedException({
        error: 'Invalid or expired authorization token',
        code: 'AUTH_REQUIRED',
      });
    }

    return {
      id: user.id,
      email: user.email ?? '',
    };
  }

  async getFullProfile(userId: string, email: string): Promise<MeResponse> {
    const userProfile = await this.fetchUserProfileRow(userId);

    if (!userProfile) {
      throw new NotFoundException({
        error: 'User profile not found',
        code: 'PROFILE_MISSING',
      });
    }

    const roleProfile = await this.fetchRoleProfileRow(
      userId,
      userProfile.role,
    );

    return toMeResponse(userProfile, email, roleProfile);
  }

  async createProfile(
    userId: string,
    role: UserRole,
    dto: CompleteProfileDto,
    email: string,
  ): Promise<MeResponse> {
    const existing = await this.fetchUserProfileRow(userId);

    if (existing) {
      throw new ConflictException({
        error: 'User profile already exists',
        code: 'PROFILE_EXISTS',
      });
    }

    const admin = this.supabaseService.getAdminClient();
    const userProfileInsert = {
      id: userId,
      role,
      display_name: dto.displayName,
      phone: dto.phone ?? null,
      avatar_url: dto.avatarUrl ?? null,
      is_active: true,
    };

    const { error: profileError } = await admin
      .from('user_profiles')
      .insert(userProfileInsert);

    if (profileError) {
      throw new InternalServerErrorException({
        error: 'Failed to create user profile',
        code: 'PROFILE_CREATE_FAILED',
        details: profileError.message,
      });
    }

    try {
      await this.insertRoleProfile(userId, role, dto);
    } catch (error) {
      await admin.from('user_profiles').delete().eq('id', userId);
      throw error;
    }

    return this.getFullProfile(userId, email);
  }

  async updateProfile(
    userId: string,
    role: UserRole,
    dto: UpdateProfileDto,
    email: string,
  ): Promise<MeResponse> {
    await this.ensureProfileExists(userId, role);

    const admin = this.supabaseService.getAdminClient();
    const userProfileUpdate = this.buildUserProfileUpdate(dto);

    if (Object.keys(userProfileUpdate).length > 0) {
      const { error } = await admin
        .from('user_profiles')
        .update(userProfileUpdate)
        .eq('id', userId);

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to update user profile',
          code: 'PROFILE_UPDATE_FAILED',
          details: error.message,
        });
      }
    }

    const roleProfileUpdate = this.buildRoleProfileUpdate(role, dto);

    if (Object.keys(roleProfileUpdate).length > 0) {
      const table = this.roleProfileTable(role);
      const { error } = await admin
        .from(table)
        .update(roleProfileUpdate)
        .eq('id', userId);

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to update role profile',
          code: 'PROFILE_UPDATE_FAILED',
          details: error.message,
        });
      }
    }

    const userProfile = await this.fetchUserProfileRow(userId);

    if (!userProfile) {
      throw new NotFoundException({
        error: 'User profile not found',
        code: 'PROFILE_MISSING',
      });
    }

    const roleProfile = await this.fetchRoleProfileRow(userId, role);

    return toMeResponse(userProfile, email, roleProfile);
  }

  async ensureProfileExists(userId: string, role: UserRole): Promise<void> {
    const existing = await this.fetchUserProfileRow(userId);

    if (existing) {
      return;
    }

    const admin = this.supabaseService.getAdminClient();
    const { error: profileError } = await admin.from('user_profiles').insert({
      id: userId,
      role,
      display_name: 'User',
      phone: null,
      avatar_url: null,
      is_active: true,
    });

    if (profileError) {
      throw new InternalServerErrorException({
        error: 'Failed to create user profile',
        code: 'PROFILE_CREATE_FAILED',
        details: profileError.message,
      });
    }

    try {
      await this.insertBlankRoleProfile(userId, role);
    } catch (error) {
      await admin.from('user_profiles').delete().eq('id', userId);
      throw error;
    }
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  private async fetchUserProfileRow(
    userId: string,
  ): Promise<UserProfileRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('id, role, display_name, phone, avatar_url, is_active')
      .eq('id', userId)
      .maybeSingle<UserProfileRow>();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private async fetchRoleProfileRow(
    userId: string,
    role: UserRole,
  ): Promise<ReturnType<typeof toHouseholdProfileResponse>> {
    const admin = this.supabaseService.getAdminClient();

    if (role === 'household') {
      const { data, error } = await admin
        .from('household_profiles')
        .select(
          'address, latitude, longitude, district, city, province, total_waste_kg, total_listings',
        )
        .eq('id', userId)
        .maybeSingle<HouseholdProfileRow>();

      if (error || !data) {
        throw new NotFoundException({
          error: 'Household profile not found',
          code: 'PROFILE_MISSING',
        });
      }

      return toHouseholdProfileResponse(mapHouseholdProfileRow(data));
    }

    if (role === 'collector') {
      const { data, error } = await admin
        .from('collector_profiles')
        .select(
          'business_name, service_area_description, base_latitude, base_longitude, vehicle_capacity_kg, rating_average, rating_count, total_pickups, total_kg_collected',
        )
        .eq('id', userId)
        .maybeSingle<CollectorProfileRow>();

      if (error || !data) {
        throw new NotFoundException({
          error: 'Collector profile not found',
          code: 'PROFILE_MISSING',
        });
      }

      return toCollectorProfileResponse(mapCollectorProfileRow(data));
    }

    const { data, error } = await admin
      .from('industry_profiles')
      .select(
        'company_name, industry_type, address, latitude, longitude, rating_average, rating_count, total_orders',
      )
      .eq('id', userId)
      .maybeSingle<IndustryProfileRow>();

    if (error || !data) {
      throw new NotFoundException({
        error: 'Industry profile not found',
        code: 'PROFILE_MISSING',
      });
    }

    return toIndustryProfileResponse(mapIndustryProfileRow(data));
  }

  private async insertRoleProfile(
    userId: string,
    role: UserRole,
    dto: CompleteProfileDto,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    if (role === 'household') {
      const { error } = await admin.from('household_profiles').insert({
        id: userId,
        address: dto.address ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        district: dto.district ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
      });

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to create household profile',
          code: 'PROFILE_CREATE_FAILED',
          details: error.message,
        });
      }

      return;
    }

    if (role === 'collector') {
      const { error } = await admin.from('collector_profiles').insert({
        id: userId,
        business_name: dto.businessName ?? null,
        service_area_description: dto.serviceAreaDescription ?? null,
        base_latitude: dto.baseLatitude ?? null,
        base_longitude: dto.baseLongitude ?? null,
        vehicle_capacity_kg: dto.vehicleCapacityKg ?? null,
      });

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to create collector profile',
          code: 'PROFILE_CREATE_FAILED',
          details: error.message,
        });
      }

      return;
    }

    if (!dto.companyName) {
      throw new BadRequestException({
        error: 'companyName is required for industry profiles',
        code: 'VALIDATION_ERROR',
      });
    }

    const { error } = await admin.from('industry_profiles').insert({
      id: userId,
      company_name: dto.companyName,
      industry_type: dto.industryType ?? null,
      address: dto.address ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to create industry profile',
        code: 'PROFILE_CREATE_FAILED',
        details: error.message,
      });
    }
  }

  private async insertBlankRoleProfile(
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    if (role === 'household') {
      const { error } = await admin
        .from('household_profiles')
        .insert({ id: userId });

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to create household profile',
          code: 'PROFILE_CREATE_FAILED',
          details: error.message,
        });
      }

      return;
    }

    if (role === 'collector') {
      const { error } = await admin
        .from('collector_profiles')
        .insert({ id: userId });

      if (error) {
        throw new InternalServerErrorException({
          error: 'Failed to create collector profile',
          code: 'PROFILE_CREATE_FAILED',
          details: error.message,
        });
      }

      return;
    }

    const { error } = await admin.from('industry_profiles').insert({
      id: userId,
      company_name: 'Pending Setup',
    });

    if (error) {
      throw new InternalServerErrorException({
        error: 'Failed to create industry profile',
        code: 'PROFILE_CREATE_FAILED',
        details: error.message,
      });
    }
  }

  private roleProfileTable(role: UserRole): string {
    if (role === 'household') {
      return 'household_profiles';
    }

    if (role === 'collector') {
      return 'collector_profiles';
    }

    return 'industry_profiles';
  }

  private buildUserProfileUpdate(
    dto: UpdateProfileDto,
  ): Record<string, string | null> {
    const update: Record<string, string | null> = {};

    if (dto.displayName !== undefined) {
      update.display_name = dto.displayName;
    }

    if (dto.phone !== undefined) {
      update.phone = dto.phone;
    }

    if (dto.avatarUrl !== undefined) {
      update.avatar_url = dto.avatarUrl;
    }

    return update;
  }

  private buildRoleProfileUpdate(
    role: UserRole,
    dto: UpdateProfileDto,
  ): Record<string, string | number | null> {
    if (role === 'household') {
      const householdDto = dto as UpdateHouseholdProfileDto;
      const update: Record<string, string | number | null> = {};

      if (householdDto.address !== undefined) {
        update.address = householdDto.address;
      }
      if (householdDto.latitude !== undefined) {
        update.latitude = householdDto.latitude;
      }
      if (householdDto.longitude !== undefined) {
        update.longitude = householdDto.longitude;
      }
      if (householdDto.district !== undefined) {
        update.district = householdDto.district;
      }
      if (householdDto.city !== undefined) {
        update.city = householdDto.city;
      }
      if (householdDto.province !== undefined) {
        update.province = householdDto.province;
      }

      return update;
    }

    if (role === 'collector') {
      const collectorDto = dto as UpdateCollectorProfileDto;
      const update: Record<string, string | number | null> = {};

      if (collectorDto.businessName !== undefined) {
        update.business_name = collectorDto.businessName;
      }
      if (collectorDto.serviceAreaDescription !== undefined) {
        update.service_area_description = collectorDto.serviceAreaDescription;
      }
      if (collectorDto.baseLatitude !== undefined) {
        update.base_latitude = collectorDto.baseLatitude;
      }
      if (collectorDto.baseLongitude !== undefined) {
        update.base_longitude = collectorDto.baseLongitude;
      }
      if (collectorDto.vehicleCapacityKg !== undefined) {
        update.vehicle_capacity_kg = collectorDto.vehicleCapacityKg;
      }

      return update;
    }

    const industryDto = dto as UpdateIndustryProfileDto;
    const update: Record<string, string | number | null> = {};

    if (industryDto.companyName !== undefined) {
      update.company_name = industryDto.companyName;
    }
    if (industryDto.industryType !== undefined) {
      update.industry_type = industryDto.industryType;
    }
    if (industryDto.address !== undefined) {
      update.address = industryDto.address;
    }
    if (industryDto.latitude !== undefined) {
      update.latitude = industryDto.latitude;
    }
    if (industryDto.longitude !== undefined) {
      update.longitude = industryDto.longitude;
    }

    return update;
  }
}
