import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BillingTypeDto {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export enum HoursPerWeekDto {
  LESS_THAN_10 = 'LESS_THAN_10',
  FROM_11_TO_20 = 'FROM_11_TO_20',
  FROM_21_TO_30 = 'FROM_21_TO_30',
  MORE_THAN_30 = 'MORE_THAN_30',
}

export enum ExperienceLevelDto {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
}

export enum ProjectTypeDto {
  ONE_TIME = 'ONE_TIME',
  CONTINUOUS = 'CONTINUOUS',
}

export enum ListingLanguageDto {
  ENGLISH = 'ENGLISH',
  POLISH = 'POLISH',
}

export class CreateListingDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1, { message: 'Description is required' })
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsEnum(ListingLanguageDto)
  language?: ListingLanguageDto;

  @IsEnum(BillingTypeDto)
  billingType: BillingTypeDto;

  @IsEnum(HoursPerWeekDto)
  @ValidateIf((o) => o.billingType === BillingTypeDto.HOURLY)
  @IsNotEmpty({ message: 'Hours per week is required when billing is hourly' })
  hoursPerWeek?: HoursPerWeekDto;

  @IsNumber()
  @Min(0, { message: 'Rate must be non-negative' })
  @Type(() => Number)
  rate: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rateNegotiable?: boolean;

  @IsString()
  @MinLength(3, { message: 'Currency must be 3 characters (e.g. PLN, EUR)' })
  @MaxLength(3)
  currency: string;

  @IsEnum(ExperienceLevelDto)
  experienceLevel: ExperienceLevelDto;

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsBoolean()
  @Type(() => Boolean)
  isRemote: boolean;

  @IsEnum(ProjectTypeDto)
  projectType: ProjectTypeDto;

  /** Number of days to collect offers: 7, 14, 21 or 30. Sets deadline = createdAt + offerDays. */
  @IsOptional()
  @IsNumber()
  @IsIn([7, 14, 21, 30], { message: 'Offer days must be 7, 14, 21 or 30' })
  @Type(() => Number)
  offerDays?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  /** New skill names to create and attach (like tags). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  newSkillNames?: string[];
}
