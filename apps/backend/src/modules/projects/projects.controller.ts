import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrgMemberGuard } from '@/common/guards/org-member.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  @Get()
  @UseGuards(OrgMemberGuard)
  findAll(@CurrentUser() user: any) {
    return { message: 'Projects list stub', userId: user?.id };
  }
}
