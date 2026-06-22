import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { RatingService } from './rating.service';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @Roles('household', 'collector', 'industry')
  submitRating(@CurrentUser() user: AuthUser, @Body() dto: SubmitRatingDto) {
    return this.ratingService.submitRating(user.id, user.role, {
      rateeId: dto.rateeId,
      rating: dto.rating,
      reviewText: dto.reviewText,
      contextType: dto.contextType,
      contextId: dto.contextId,
    });
  }

  @Get('summary/:actorId')
  @Public()
  getRatingSummary(@Param('actorId', ParseUUIDPipe) actorId: string) {
    return this.ratingService.getRatingSummary(actorId);
  }
}
