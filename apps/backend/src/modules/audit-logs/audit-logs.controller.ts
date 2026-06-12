import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { AuditLogsService } from './audit-logs.service';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Audit Logs')
@Controller('organizations/:organizationId/audit-logs')
@UseGuards(OrgRolesGuard)
@Auth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  async findAll(
    @Param('organizationId') orgId: string,
    @Query('projectId') projectId?: string,
    @Query('entityType') entityType?: string,
    @Query('actionType') actionType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditLogsService.list({
      orgId,
      projectId,
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
  async findOne(
    @Param('organizationId') orgId: string,
    @Param('logId') logId: string,
  ) {
    const log = await this.auditLogsService.findOne(orgId, logId);
    return log;
  }
}
