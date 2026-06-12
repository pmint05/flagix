import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
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
  @ApiOperation({ summary: 'Create SDK key' })
  async create(
    @Param('organizationId') orgId: string,
    @Param('envId') envId: string,
    @Body() body: CreateSdkKeyDto,
  ) {
    return this.sdkKeysService.create(orgId, envId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List SDK keys' })
  async findAll(
    @Param('organizationId') orgId: string,
    @Param('envId') envId: string,
  ) {
    const sdkKeys = await this.sdkKeysService.findAllForEnv(orgId, envId);
    return { sdkKeys };
  }

  @Delete(':keyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke SDK key' })
  async revoke(
    @Param('organizationId') orgId: string,
    @Param('envId') envId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.sdkKeysService.revoke(orgId, envId, keyId);
  }
}
