import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
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
  async findOne(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
  ) {
    return this.flagsService.findOne(orgId, flagId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update feature flag' })
  async update(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    return this.flagsService.update(orgId, flagId, dto);
  }

  @Delete()
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete feature flag' })
  async remove(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
  ) {
    return this.flagsService.remove(orgId, flagId);
  }
}
