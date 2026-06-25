import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { PlatformOrgRoles } from '@/common/decorators/org-roles.decorator';
import {
  CurrentContext,
  OrgContext,
} from '@/common/decorators/current-context.decorator';
import { SdkKeysService } from './sdk-keys.service';
import { CreateSdkKeyDto } from './dto/create-sdk-key.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('SDK Keys')
@Controller('organizations/:organizationId/environments/:envId/sdk-keys')
@UseGuards(OrgRolesGuard)
@Auth()
export class SdkKeysController {
  constructor(private readonly sdkKeysService: SdkKeysService) {}

  @Post()
  @PlatformOrgRoles(['admin'])
  @ApiOperation({ summary: 'Create SDK key' })
  async create(
    @CurrentContext() ctx: OrgContext,
    @Body() body: CreateSdkKeyDto,
  ) {
    return this.sdkKeysService.create(ctx.organizationId, ctx.envId!, body);
  }

  @Get()
  @ApiOperation({ summary: 'List SDK keys' })
  async findAll(@CurrentContext() ctx: OrgContext) {
    const sdkKeys = await this.sdkKeysService.findAllForEnv(
      ctx.organizationId,
      ctx.envId!,
    );
    return { sdkKeys };
  }

  @Delete(':keyId')
  @PlatformOrgRoles(['admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke SDK key' })
  async revoke(@CurrentContext() ctx: OrgContext) {
    return this.sdkKeysService.revoke(
      ctx.organizationId,
      ctx.envId!,
      ctx.keyId!,
    );
  }
}
