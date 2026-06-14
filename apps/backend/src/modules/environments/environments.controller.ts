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
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Environments')
@Controller('organizations/:organizationId/projects/:projectId/environments')
@UseGuards(OrgRolesGuard)
@Auth()
export class EnvironmentsController {
  constructor(private readonly envService: EnvironmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create environment' })
  async create(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateEnvironmentDto,
  ) {
    return this.envService.create(orgId, projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List environments for project' })
  async findAll(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    const environments = await this.envService.findAllForProject(
      orgId,
      projectId,
    );
    return { environments, total: environments.length };
  }

  @Get(':envId')
  @ApiOperation({ summary: 'Get environment' })
  async findOne(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
  ) {
    return this.envService.findOne(orgId, projectId, envId);
  }

  @Patch(':envId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update environment' })
  async update(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
    @Body() dto: UpdateEnvironmentDto,
  ) {
    return this.envService.update(orgId, projectId, envId, dto);
  }

  @Delete(':envId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete environment' })
  async remove(
    @Param('organizationId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('envId') envId: string,
  ) {
    return this.envService.remove(orgId, projectId, envId);
  }
}
