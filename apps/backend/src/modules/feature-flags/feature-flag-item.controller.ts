import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import {
  UpdateFeatureFlagDto,
  PatchFeatureFlagConfigDto,
} from './dto/feature-flag.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Feature Flags')
@Controller('organizations/:organizationId/flags/:flagId')
@UseGuards(OrgRolesGuard)
@Auth()
export class FeatureFlagItemController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get feature flag' })
  async findOne(
    @CurrentContext() ctx: OrgContext,
    @Query('envId') envId?: string,
  ) {
    return this.flagsService.findOne(ctx.organizationId, ctx.flagId!, envId);
  }

  @Patch()
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update feature flag' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.flagsService.update(ctx.organizationId, ctx.flagId!, dto);
  }

  @Patch('environments/:envId/state')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update flag state for environment' })
  async updateFlagState(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: { isEnabled?: boolean; status?: string },
  ) {
    return this.flagsService.updateFlagState(
      ctx.organizationId,
      ctx.flagId!,
      ctx.envId!,
      dto,
    );
  }

  @Patch('environments/:envId/config')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({
    summary: 'Patch feature flag config (variations, rules, etc.)',
  })
  async patchConfig(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: PatchFeatureFlagConfigDto,
  ) {
    return this.flagsService.patchConfig(
      ctx.organizationId,
      ctx.flagId!,
      ctx.envId!,
      dto,
    );
  }

  @Post('environments/:envId/simulate')
  @ApiOperation({ summary: 'Simulate flag evaluation' })
  async simulate(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: { context: any; flagConfig?: any },
  ) {
    return this.flagsService.simulate(
      ctx.organizationId,
      ctx.flagId!,
      ctx.envId!,
      dto.context,
      dto.flagConfig,
    );
  }

  @Delete()
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete feature flag' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.flagsService.remove(ctx.organizationId, ctx.flagId!);
  }
}
