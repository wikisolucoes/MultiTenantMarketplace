import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@wikistore.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'Login successful',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: number;
    email: string;
    fullName: string;
    tenantId: number | null;
    isActive: boolean;
  };
}