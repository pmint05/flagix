import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('Tags')
@Controller('organizations/:organizationId/projects/:projectId/tags')
@UseGuards(OrgRolesGuard)
@Auth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @PlatformOrgRoles(['admin', 'editor'])
  @ApiOperation({ summary: 'Create tag' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.create(ctx.organizationId, ctx.projectId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List or search project tags' })
  async findAll(
    @CurrentContext() ctx: OrgContext,
    @Query('q') q?: string,
  ) {
    if (q) {
      const data = await this.tagsService.searchInProject(ctx.projectId!, q);
      return { data, total: data.length };
    }
    const data = await this.tagsService.findAllForProject(ctx.projectId!);
    return { data, total: data.length };
  }

  @Delete(':tagId')
  @PlatformOrgRoles(['admin', 'editor'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tag' })
  async remove(
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.remove(tagId);
  }
}
