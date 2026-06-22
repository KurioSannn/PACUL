import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateCollectorProfileDto } from './dto/update-collector-profile.dto';
import { UpdateHouseholdProfileDto } from './dto/update-household-profile.dto';
import { UpdateIndustryProfileDto } from './dto/update-industry-profile.dto';
import { ProfilesService } from './profiles.service';
import type { UserRole } from './profiles.types';

@ApiTags('auth')
@ApiBearerAuth('bearer')
@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.profilesService.getFullProfile(user.id, user.email);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update role-specific profile fields' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = await this.validateUpdateDto(user.role, body);
    return this.profilesService.updateProfile(
      user.id,
      user.role,
      dto,
      user.email,
    );
  }

  @Public()
  @Post('auth/complete-profile')
  @ApiOperation({
    summary: 'Complete onboarding profile after Supabase sign-up',
  })
  async completeProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CompleteProfileDto,
  ) {
    const authUser =
      await this.profilesService.resolveUserFromAuthorization(authorization);

    return this.profilesService.createProfile(
      authUser.id,
      dto.role,
      dto,
      authUser.email,
    );
  }

  private async validateUpdateDto(
    role: UserRole,
    body: Record<string, unknown>,
  ): Promise<
    | UpdateHouseholdProfileDto
    | UpdateCollectorProfileDto
    | UpdateIndustryProfileDto
  > {
    const dtoClass =
      role === 'household'
        ? UpdateHouseholdProfileDto
        : role === 'collector'
          ? UpdateCollectorProfileDto
          : UpdateIndustryProfileDto;

    const dto = plainToInstance(dtoClass, body);

    try {
      await validateOrReject(dto);
    } catch {
      throw new BadRequestException({
        error: 'Profile update payload is invalid for your role',
        code: 'VALIDATION_ERROR',
      });
    }

    return dto;
  }
}
