import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { UpdateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Feature Flags')
@Controller('organizations/:organizationId/flags/:flagId')
@UseGuards(OrgRolesGuard)
@Auth()
export class FeatureFlagItemController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get feature flag' })
  async findOne(@CurrentContext() ctx: OrgContext) {
    return this.flagsService.findOne(ctx.organizationId, ctx.flagId!);
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

  @Delete()
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete feature flag' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.flagsService.remove(ctx.organizationId, ctx.flagId!);
  }
}
