import {
  IsBoolean,
  IsDateString,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  role: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  productionType: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  location: string;

  @IsBoolean()
  isPaid: boolean;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
