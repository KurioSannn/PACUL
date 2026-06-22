import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { ChannelAuthService } from './channel-auth';
import { ChannelAuthDto } from './dto/channel-auth.dto';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly channelAuthService: ChannelAuthService) {}

  @Post('channel-auth')
  @Roles('industry', 'collector')
  async authorizeChannel(
    @CurrentUser() user: AuthUser,
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ChannelAuthDto,
  ) {
    const accessToken = this.extractBearerToken(authorization);

    if (!accessToken) {
      return { authorized: false };
    }

    return this.channelAuthService.authorizeChannel(
      dto.channelName,
      user.id,
      accessToken,
    );
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }
}
