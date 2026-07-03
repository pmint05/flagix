import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
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
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  featureFlagListQuerySchema,
  type FeatureFlagListQuery,
} from '@flagix/shared';

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
    return this.flagsService.create(ctx.organizationId, ctx.projectId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  async findAll(
    @CurrentContext() ctx: OrgContext,
    @Query(new ZodValidationPipe(featureFlagListQuerySchema))
    query: FeatureFlagListQuery,
  ) {
    return this.flagsService.findAllForEnv(
      ctx.organizationId,
      ctx.projectId!,
      query.envId,
      query,
    );
  }

  @Get('by-key/:key')
  @ApiOperation({ summary: 'Get feature flag by key' })
  async findByKey(
    @CurrentContext() ctx: OrgContext,
    @Param('key') key: string,
    @Query('envId') envId?: string,
  ) {
    return this.flagsService.findByKey(
      ctx.organizationId,
      ctx.projectId!,
      key,
      envId,
    );
  }
}
