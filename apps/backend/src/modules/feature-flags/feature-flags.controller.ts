import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Feature Flags')
@Controller(
  'organizations/:organizationId/projects/:projectId/environments/:envId/flags',
)
@UseGuards(OrgRolesGuard)
@Auth()
export class FeatureFlagsController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create feature flag' })
  async create(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Body() dto: CreateFeatureFlagDto,
  ) {
    return this.flagsService.create(orgId, projectId, envId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  async findAll(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Query('status') status?: string,
  ) {
    const flags = await this.flagsService.findAllForEnv(orgId, envId, status);
    return { flags, total: flags.length };
  }
}
