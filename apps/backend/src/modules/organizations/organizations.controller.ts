import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrgMemberGuard } from '@/common/guards/org-member.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  @Get()
  @UseGuards(OrgMemberGuard)
  findAll(@CurrentUser() user: any) {
    return { message: 'Organizations list stub', userId: user?.id };
  }
}
