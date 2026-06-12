import {
  Controller,
  Get,
  Post,
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
import { TargetingRulesService } from './targeting-rules.service';
import {
  CreateTargetingRuleDto,
  UpdateTargetingRuleDto,
} from './dto/create-targeting-rule.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Targeting Rules')
@Controller('organizations/:organizationId/flags/:flagId/rules')
@UseGuards(OrgRolesGuard)
@Auth()
export class TargetingRulesController {
  constructor(private readonly rulesService: TargetingRulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create targeting rule' })
  async create(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
    @Body() dto: CreateTargetingRuleDto,
  ) {
    return this.rulesService.create(orgId, flagId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List targeting rules' })
  async findAll(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
  ) {
    const rules = await this.rulesService.findAllForFlag(orgId, flagId);
    return { rules, total: rules.length };
  }

  @Get(':ruleId')
  @ApiOperation({ summary: 'Get targeting rule' })
  async findOne(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.rulesService.findOne(orgId, flagId, ruleId);
  }

  @Patch(':ruleId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update targeting rule' })
  async update(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateTargetingRuleDto,
  ) {
    return this.rulesService.update(orgId, flagId, ruleId, dto);
  }

  @Delete(':ruleId')
  @PlatformOrgRoles(['admin', 'editor'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete targeting rule' })
  async remove(
    @Param('organizationId') orgId: string,
    @Param('flagId') flagId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.rulesService.remove(orgId, flagId, ruleId);
  }
}
