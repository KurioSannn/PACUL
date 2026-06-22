import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTextMessageDto {
  @ApiProperty({ maxLength: 5000, example: 'Can you deliver within 3 days?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
