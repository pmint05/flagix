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
import { CreateInvitationDto, UpdateMemberRoleDto } from './dto/invitation.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Organizations')
@Controller('organizations')
@Auth()
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('invitations/pending')
  @ApiOperation({ summary: 'List pending invitations for the current user' })
  async getMyInvitations(@CurrentUser() user: any) {
    return this.orgService.getUserPendingInvitations(user.email);
  }

  @Post('invitations/:invitationId/accept')
  @ApiOperation({ summary: 'Accept organization invitation' })
  async acceptMyInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.orgService.acceptInvitation(user.id, user.email, invitationId);
  }

  @Post('invitations/:invitationId/reject')
  @ApiOperation({ summary: 'Reject organization invitation' })
  async rejectMyInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.orgService.rejectInvitation(user.email, invitationId);
  }

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

  @Post(':organizationId/invitations')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Invite a member to organization' })
  async invite(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.orgService.inviteMember(ctx.organizationId, user.id, dto.email, dto.role);
  }

  @Get(':organizationId/invitations')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Get sent invitations for organization' })
  async getInvitations(@CurrentContext() ctx: OrgContext) {
    return this.orgService.getSentInvitations(ctx.organizationId);
  }

  @Delete(':organizationId/invitations/:invitationId')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Cancel a pending organization invitation' })
  async cancelInvitation(
    @CurrentContext() ctx: OrgContext,
    @Param('invitationId') invitationId: string,
  ) {
    return this.orgService.cancelInvitation(ctx.organizationId, invitationId);
  }

  @Patch(':organizationId/members/:memberId')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Update organization member role' })
  async updateMember(
    @CurrentContext() ctx: OrgContext,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgService.updateMemberRole(ctx.organizationId, memberId, dto.role);
  }

  @Delete(':organizationId/members/:memberId')
  @UseGuards(OrgRolesGuard)
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Remove organization member' })
  async removeMember(
    @CurrentContext() ctx: OrgContext,
    @Param('memberId') memberId: string,
  ) {
    return this.orgService.removeMember(ctx.organizationId, memberId);
  }
}
