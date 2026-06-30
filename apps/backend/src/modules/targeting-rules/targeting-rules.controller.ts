import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
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
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create targeting rule' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateTargetingRuleDto,
  ) {
    return this.rulesService.create(ctx.organizationId, ctx.flagId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List targeting rules' })
  async findAll(
    @CurrentContext() ctx: OrgContext,
    @Query('envId') envId?: string,
  ) {
    const rules = await this.rulesService.findAllForFlag(
      ctx.organizationId,
      ctx.flagId!,
      envId,
    );
    return { rules, total: rules.length };
  }

  @Get(':ruleId')
  @ApiOperation({ summary: 'Get targeting rule' })
  async findOne(@CurrentContext() ctx: OrgContext) {
    return this.rulesService.findOne(
      ctx.organizationId,
      ctx.flagId!,
      ctx.ruleId!,
    );
  }

  @Patch(':ruleId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update targeting rule' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: UpdateTargetingRuleDto,
  ) {
    return this.rulesService.update(
      ctx.organizationId,
      ctx.flagId!,
      ctx.ruleId!,
      dto,
    );
  }

  @Delete(':ruleId')
  @PlatformOrgRoles(['admin', 'editor'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete targeting rule' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.rulesService.remove(
      ctx.organizationId,
      ctx.flagId!,
      ctx.ruleId!,
    );
  }
}
