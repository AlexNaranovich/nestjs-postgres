import { IsEmail, IsString, Length, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @ApiPropertyOptional({ example: 'Alexander', minLength: 1, maxLength: 100 })
  @Length(1, 100)
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  @ApiPropertyOptional({ example: 'alex@example.com', format: 'email' })
  email?: string;
}