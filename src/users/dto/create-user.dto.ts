import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsString()
  @ApiProperty({ example: 'Alex', minLength: 1, maxLength: 100 })
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'alex@example.com', format: 'email' })
  @IsEmail()
  email!: string;
}