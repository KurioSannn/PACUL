import { IsString, Matches, MaxLength } from 'class-validator';

const CHANNEL_NAME_PATTERN = /^negotiation:[0-9a-f-]{36}$/i;

export class ChannelAuthDto {
  @IsString()
  @MaxLength(120)
  @Matches(CHANNEL_NAME_PATTERN, {
    message: 'channelName must match negotiation:{threadId}',
  })
  channelName!: string;
}
