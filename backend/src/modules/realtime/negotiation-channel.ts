import { Injectable } from '@nestjs/common';
import { ChannelAuthService, getChannelName } from './channel-auth';

export { getChannelName };

@Injectable()
export class NegotiationChannelAccess {
  constructor(private readonly channelAuthService: ChannelAuthService) {}

  async verifyChannelAccess(
    threadId: string,
    userId: string,
  ): Promise<boolean> {
    return this.channelAuthService.authorizeChannelAccess(
      getChannelName(threadId),
      userId,
    );
  }
}
