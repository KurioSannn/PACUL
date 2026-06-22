import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  THROTTLE_LIMITS,
  THROTTLE_TTL,
} from '../../common/config/throttle.config';
import type { AuthUser } from '../../common/types/auth-user';
import { ClassificationService } from './classification.service';
import { ModelVersionService } from './model-version.service';
import { ClassifyWasteDto } from './dto/classify-waste.dto';
import { OverrideClassificationDto } from './dto/override-classification.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly classificationService: ClassificationService,
    private readonly modelVersionService: ModelVersionService,
  ) {}

  @Post('classify-waste')
  @Throttle({
    default: {
      limit: THROTTLE_LIMITS.aiClassifyPerMinute,
      ttl: THROTTLE_TTL.oneMinuteMs,
    },
  })
  classifyWaste(@CurrentUser() user: AuthUser, @Body() dto: ClassifyWasteDto) {
    return this.classificationService.classifyWasteImage(
      user.id,
      dto.imagePath,
    );
  }

  @Public()
  @Get('model-version')
  getModelVersion() {
    return this.modelVersionService.getActiveModelVersion();
  }

  @Get('classifications/:id')
  getClassification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.classificationService.getClassification(id, user.id);
  }

  @Get('classifications/:id/override-history')
  getOverrideHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.classificationService.getOverrideHistory(id, user.id);
  }

  @Post('classifications/:id/override')
  overrideClassification(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideClassificationDto,
  ) {
    return this.classificationService.overrideClassification(
      id,
      user.id,
      dto.categoryId,
      dto.reason,
    );
  }
}
