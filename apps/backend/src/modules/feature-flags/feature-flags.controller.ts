import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/feature-flag.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Feature Flags')
@Controller('organizations/:organizationId/projects/:projectId/flags')
@UseGuards(OrgRolesGuard)
@Auth()
export class FeatureFlagsController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Post()
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create feature flag' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateFeatureFlagDto,
  ) {
    return this.flagsService.create(
      ctx.organizationId,
      ctx.projectId!,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  async findAll(
    @CurrentContext() ctx: OrgContext,
    @Query('envId') envId: string,
    @Query('status') status?: string,
  ) {
    const flags = await this.flagsService.findAllForEnv(
      ctx.organizationId,
      envId,
      status,
    );
    return { flags, total: flags.length };
  }

  @Get('by-key/:key')
  @ApiOperation({ summary: 'Get feature flag by key' })
  async findByKey(
    @CurrentContext() ctx: OrgContext,
    @Param('key') key: string,
    @Query('envId') envId?: string,
  ) {
    return this.flagsService.findByKey(ctx.organizationId, ctx.projectId!, key, envId);
  }
}
