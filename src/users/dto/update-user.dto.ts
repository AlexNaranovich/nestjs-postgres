import { IsEmail, IsString, Length, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 100)
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  email?: string;
}