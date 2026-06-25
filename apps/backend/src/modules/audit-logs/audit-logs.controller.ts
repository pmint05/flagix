import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { AuditLogsService } from './audit-logs.service';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Audit Logs')
@Controller('organizations/:organizationId/audit-logs')
@UseGuards(OrgRolesGuard)
@PlatformOrgRoles(['admin'])
@Auth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  async findAll(
    @CurrentContext() ctx: OrgContext,
    @Query('projectId') projectId?: string,
    @Query('environmentId') environmentId?: string,
    @Query('entityType') entityType?: string,
    @Query('actionType') actionType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditLogsService.list({
      orgId: ctx.organizationId,
      projectId,
      environmentId,
      entityType,
      actionType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':logId')
  @ApiOperation({ summary: 'Get audit log entry' })
  async findOne(@CurrentContext() ctx: OrgContext) {
    const log = await this.auditLogsService.findOne(
      ctx.organizationId,
      ctx.logId!,
    );
    return log;
  }
}
