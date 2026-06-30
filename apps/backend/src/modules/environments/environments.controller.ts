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
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create environment' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateEnvironmentDto,
  ) {
    return this.envService.create(ctx.organizationId, ctx.projectId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List environments for project' })
  async findAll(@CurrentContext() ctx: OrgContext) {
    const environments = await this.envService.findAllForProject(
      ctx.organizationId,
      ctx.projectId!,
    );
    return { environments, total: environments.length };
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get environment by slug' })
  async findBySlug(
    @CurrentContext() ctx: OrgContext,
    @Param('slug') slug: string,
  ) {
    return this.envService.findBySlug(
      ctx.organizationId,
      ctx.projectId!,
      slug,
    );
  }

  @Get(':envId')
  @ApiOperation({ summary: 'Get environment' })
  async findOne(@CurrentContext() ctx: OrgContext) {
    return this.envService.findOne(
      ctx.organizationId,
      ctx.projectId!,
      ctx.envId!,
    );
  }

  @Patch(':envId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update environment' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: UpdateEnvironmentDto,
  ) {
    return this.envService.update(
      ctx.organizationId,
      ctx.projectId!,
      ctx.envId!,
      dto,
    );
  }

  @Delete(':envId')
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete environment' })
  async remove(@CurrentContext() ctx: OrgContext) {
    return this.envService.remove(
      ctx.organizationId,
      ctx.projectId!,
      ctx.envId!,
    );
  }
}
