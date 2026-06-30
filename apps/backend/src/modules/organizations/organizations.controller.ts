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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/create-organization.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Organizations')
@Controller('organizations')
@Auth()
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: any) {
    return this.orgService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations for current user' })
  async findAll(@CurrentUser() user: any) {
    const orgs = await this.orgService.findAllForUser(user.id);
    return { data: orgs, total: orgs.length };
  }

  @Get(':organizationId')
  @UseGuards(OrgRolesGuard)
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@CurrentContext() ctx: OrgContext, @CurrentUser() user: any) {
    return this.orgService.findOneForUser(ctx.organizationId, user.id);
  }

  @Patch(':organizationId')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(ctx.organizationId, dto);
  }

  @Delete(':organizationId')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete organization' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.orgService.remove(ctx.organizationId);
  }

  @Get(':organizationId/users')
  @UseGuards(OrgRolesGuard)
  @ApiOperation({ summary: 'List organization users' })
  async findUsers(@CurrentContext() ctx: OrgContext) {
    const users = await this.orgService.findUsers(ctx.organizationId, ctx.role);
    return { data: users, total: users.length };
  }
}
