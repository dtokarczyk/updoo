import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
}
