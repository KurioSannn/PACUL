import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePickupClaimDto {
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;
}
