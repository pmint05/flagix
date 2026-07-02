import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { Auth } from '@/common/decorators/auth.decorator';
import { EvaluationAnalyticsService } from './evaluation-analytics.service';

@ApiTags('Analytics')
@Controller()
@UseGuards(OrgRolesGuard)
@Auth()
export class EvaluationAnalyticsController {
  constructor(private readonly analyticsService: EvaluationAnalyticsService) {}

  @Get('organizations/:orgId/analytics/flags/:flagId')
  @ApiOperation({ summary: 'Get per-flag analytics' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiParam({ name: 'flagId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'granularity', required: false })
  @ApiQuery({ name: 'environmentId', required: false })
  async getFlagAnalytics(
    @Param('orgId') orgId: string,
    @Param('flagId') flagId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
    @Query('environmentId') environmentId?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.analyticsService.getFlagAnalytics(orgId, flagId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: (granularity === 'day' ? 'day' : 'hour'),
    }, environmentId);
  }

  @Get('organizations/:orgId/analytics/flags/:flagId/environments/:envId')
  @ApiOperation({ summary: 'Get flag analytics for a specific environment' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiParam({ name: 'flagId', required: true })
  @ApiParam({ name: 'envId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'granularity', required: false })
  async getFlagEnvironmentDetail(
    @Param('orgId') orgId: string,
    @Param('flagId') flagId: string,
    @Param('envId') envId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.analyticsService.getFlagEnvironmentDetail(orgId, flagId, envId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: (granularity === 'day' ? 'day' : 'hour'),
    });
  }

  @Get('organizations/:orgId/analytics/overview')
  @ApiOperation({ summary: 'Get organization-level analytics overview' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'granularity', required: false })
  async getOverview(
    @Param('orgId') orgId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.analyticsService.getOverview(orgId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: (granularity === 'day' ? 'day' : 'hour'),
    });
  }

  @Get('organizations/:orgId/analytics/environments/:envId')
  @ApiOperation({ summary: 'Get all flags analytics for a specific environment' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiParam({ name: 'envId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getEnvironmentAnalytics(
    @Param('orgId') orgId: string,
    @Param('envId') envId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.analyticsService.getEnvironmentAnalytics(orgId, envId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: 'hour',
    });
  }

  @Get('organizations/:orgId/projects/:projectId/analytics/overview')
  @ApiOperation({ summary: 'Get project-level analytics overview' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiParam({ name: 'projectId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'granularity', required: false })
  @ApiQuery({ name: 'environmentIds', required: false })
  async getProjectOverview(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
    @Query('environmentIds') environmentIds?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const envIds = environmentIds
      ? environmentIds.split(',').filter(Boolean)
      : undefined;

    return this.analyticsService.getProjectOverview(orgId, projectId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: (granularity === 'day' ? 'day' : 'hour'),
    }, envIds);
  }

  @Get('organizations/:orgId/projects/:projectId/analytics/environments/:envId')
  @ApiOperation({ summary: 'Get environment analytics within a project' })
  @ApiParam({ name: 'orgId', required: true })
  @ApiParam({ name: 'projectId', required: true })
  @ApiParam({ name: 'envId', required: true })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getProjectEnvironmentAnalytics(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.analyticsService.getEnvironmentAnalytics(orgId, envId, {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : now,
      granularity: 'hour',
    }, projectId);
  }
}
