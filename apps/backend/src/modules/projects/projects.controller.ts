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
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Projects')
@Controller('organizations/:organizationId/projects')
@UseGuards(OrgRolesGuard)
@Auth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create project' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(ctx.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  async findAll(@CurrentContext() ctx: OrgContext) {
    const projects = await this.projectsService.findAll(ctx.organizationId);
    return { data: projects, total: projects.length };
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get project by slug' })
  async findBySlug(
    @CurrentContext() ctx: OrgContext,
    @Param('slug') slug: string,
  ) {
    return this.projectsService.findBySlug(ctx.organizationId, slug);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project' })
  async findOne(@CurrentContext() ctx: OrgContext) {
    return this.projectsService.findOne(ctx.organizationId, ctx.projectId!);
  }

  @Patch(':projectId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update project' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(ctx.organizationId, ctx.projectId!, dto);
  }

  @Delete(':projectId')
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.projectsService.remove(ctx.organizationId, ctx.projectId!);
  }
}
