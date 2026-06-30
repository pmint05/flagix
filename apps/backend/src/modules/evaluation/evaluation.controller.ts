import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Throttle } from '@nestjs/throttler';
import { SdkKeyGuard } from '@/common/guards/sdk-key.guard';
import {
  SdkEnvironment,
  type SdkEnvironmentInfo,
} from '@/common/decorators/sdk-environment.decorator';
import { EvaluationService } from './evaluation.service';
import { EvaluateFlagDto } from './dto/evaluate-flag.dto';
import { EvaluateAllDto } from './dto/evaluate-all.dto';

@ApiTags('Evaluation')
@Controller('evaluate')
@UseGuards(SdkKeyGuard)
@Throttle({ evaluate: { ttl: 60_000, limit: 1000 } })
@AllowAnonymous()
@ApiHeader({
  name: 'X-SDK-Key',
  required: true,
  description: 'SDK Key for environment authentication',
})
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Evaluate a single feature flag' })
  async evaluate(
    @SdkEnvironment() env: SdkEnvironmentInfo,
    @Body() dto: EvaluateFlagDto,
  ) {
    return this.evaluationService.evaluateFlag(
      env.environmentId,
      dto.flagKey,
      dto.context,
      env.keyType,
    );
  }

  @Post('all')
  @ApiOperation({ summary: 'Evaluate all active feature flags in environment' })
  async evaluateAll(
    @SdkEnvironment() env: SdkEnvironmentInfo,
    @Body() dto: EvaluateAllDto,
  ) {
    const flags = await this.evaluationService.evaluateAllFlags(
      env.environmentId,
      dto.context,
      env.keyType,
    );
    return { flags };
  }
}
