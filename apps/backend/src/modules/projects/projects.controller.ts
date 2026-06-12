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
    @Param('organizationId') orgId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  async findAll(@Param('organizationId') orgId: string) {
    const projects = await this.projectsService.findAll(orgId);
    return { projects, total: projects.length };
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project' })
  async findOne(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(orgId, projectId);
  }

  @Patch(':projectId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(orgId, projectId, dto);
  }

  @Delete(':projectId')
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  async remove(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(orgId, projectId);
  }
}
