import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CancelNegotiationDto } from './dto/cancel-negotiation.dto';
import { NegotiationMessageFiltersDto } from './dto/negotiation-message-filters.dto';
import { SendOfferDto } from './dto/send-offer.dto';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { NegotiationService } from './negotiation.service';

@ApiTags('negotiations')
@ApiBearerAuth('bearer')
@Controller('negotiations')
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Get(':id')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Get negotiation thread detail' })
  getThread(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.negotiationService.getThread(id, user.id);
  }

  @Get(':id/messages')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'List negotiation messages with pagination' })
  getThreadMessages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: NegotiationMessageFiltersDto,
  ) {
    return this.negotiationService.getThreadMessages(
      id,
      user.id,
      filters.limit ?? 50,
      filters.before,
    );
  }

  @Post(':id/messages')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Send a text message in a negotiation thread' })
  sendTextMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendTextMessageDto,
  ) {
    return this.negotiationService.sendTextMessage(id, user.id, dto);
  }

  @Post(':id/offers')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Send a price/weight offer or counter-offer' })
  sendOffer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendOfferDto,
  ) {
    return this.negotiationService.sendOffer(id, user.id, user.role, dto);
  }

  @Post(':id/accept')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Accept the latest offer in a negotiation' })
  acceptOffer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.negotiationService.acceptOffer(id, user.id);
  }

  @Post(':id/cancel')
  @Roles('industry', 'collector')
  @ApiOperation({ summary: 'Cancel an active negotiation thread' })
  cancelNegotiation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelNegotiationDto,
  ) {
    return this.negotiationService.cancelNegotiation(id, user.id, dto);
  }
}
