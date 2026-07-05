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
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Segments')
@Controller('organizations/:organizationId/projects/:projectId/segments')
@UseGuards(OrgRolesGuard)
@Auth()
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create segment' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.segmentsService.create(ctx.organizationId, ctx.projectId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List segments for project' })
  async findAll(@CurrentContext() ctx: OrgContext) {
    const data = await this.segmentsService.findAllForProject(ctx.projectId!);
    return { data, total: data.length };
  }

  @Get(':segmentSlug')
  @ApiOperation({ summary: 'Get segment details by slug' })
  async findOne(
    @CurrentContext() ctx: OrgContext,
    @Param('segmentSlug') segmentSlug: string,
  ) {
    return this.segmentsService.findOneBySlug(ctx.projectId!, segmentSlug);
  }

  @Patch(':segmentId')
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Update segment' })
  async update(
    @CurrentContext() ctx: OrgContext,
    @Param('segmentId') segmentId: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.segmentsService.update(ctx.projectId!, segmentId, dto);
  }

  @Delete(':segmentId')
  @PlatformOrgRoles(['admin', 'editor'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete segment' })
  async remove(
    @CurrentContext() ctx: OrgContext,
    @Param('segmentId') segmentId: string,
  ) {
    return this.segmentsService.remove(ctx.projectId!, segmentId);
  }
}
