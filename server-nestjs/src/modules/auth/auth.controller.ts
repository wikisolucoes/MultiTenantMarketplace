import { Controller, Post, Body, Get, Req, Session, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Session() session: any) {
    const result = await this.authService.login(loginDto);
    
    // Store user in session (compatible with Express session format)
    session.user = result.user;
    
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Session() session: any) {
    session.destroy();
    return { message: 'Logout successful' };
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Session() session: any) {
    if (!session.user) {
      throw new UnauthorizedException('No active session');
    }

    return this.authService.getUserById(session.user.id);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'Authentication status' })
  async checkAuth(@Session() session: any) {
    return {
      isAuthenticated: !!session.user,
      user: session.user || null
    };
  }
}