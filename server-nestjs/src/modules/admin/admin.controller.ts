import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants for admin dashboard' })
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users for admin dashboard' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('system-metrics')
  @ApiOperation({ summary: 'Get system performance metrics' })
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('system/status')
  @ApiOperation({ summary: 'Get system status information' })
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  @Get('system/database-performance')
  @ApiOperation({ summary: 'Get database performance metrics' })
  async getDatabasePerformance() {
    return this.adminService.getDatabasePerformance();
  }

  @Get('system/api-analytics')
  @ApiOperation({ summary: 'Get API analytics and usage statistics' })
  async getApiAnalytics() {
    return this.adminService.getApiAnalytics();
  }

  @Get('system/security-logs')
  @ApiOperation({ summary: 'Get security logs and events' })
  async getSecurityLogs() {
    return this.adminService.getSecurityLogs();
  }

  @Get('plugins')
  @ApiOperation({ summary: 'Get installed plugins and their status' })
  async getPlugins() {
    return this.adminService.getPlugins();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get comprehensive business reports' })
  async getReports() {
    return this.adminService.getReports();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get admin notifications' })
  async getNotifications() {
    return this.adminService.getNotifications();
  }
}