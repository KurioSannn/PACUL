import { IsNotEmpty, IsString } from 'class-validator';

export class ClassifyWasteDto {
  @IsString()
  @IsNotEmpty()
  imagePath!: string;
}
