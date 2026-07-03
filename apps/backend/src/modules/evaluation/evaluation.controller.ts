import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Throttle } from '@nestjs/throttler';
import { SdkKeyGuard } from '@/common/guards/sdk-key.guard';
import {
  SdkEnvironment,
  type SdkEnvironmentInfo,
} from '@/common/decorators/sdk-environment.decorator';
import { EvaluationService } from './evaluation.service';
import { EvaluationCollectorService } from '@/modules/evaluation-collector/evaluation-collector.service';
import { EvaluateFlagDto } from './dto/evaluate-flag.dto';
import { EvaluateAllDto } from './dto/evaluate-all.dto';

@AllowAnonymous()
@ApiTags('Evaluation')
@Controller('evaluate')
@UseGuards(SdkKeyGuard)
@Throttle({ evaluate: { ttl: 60_000, limit: 1000 } })
@ApiHeader({
  name: 'X-SDK-Key',
  required: true,
  description: 'SDK Key for environment authentication',
})
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly collector: EvaluationCollectorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Evaluate a single feature flag' })
  async evaluate(
    @SdkEnvironment() env: SdkEnvironmentInfo,
    @Body() dto: EvaluateFlagDto,
    @Req()
    req: {
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    },
  ) {
    const result = await this.evaluationService.evaluateFlag(
      env.environmentId,
      dto.flagKey,
      dto.context,
      env.keyType,
      env.projectId,
    );

    this.collector.record(result, {
      organizationId: env.organizationId,
      projectId: env.projectId,
      environmentId: env.environmentId,
      sdkKeyId: env.sdkKeyId,
      clientIp: req.ip,
      contextUserId: dto.context.userId,
    });

    return result;
  }

  @Post('all')
  @ApiOperation({ summary: 'Evaluate all active feature flags in environment' })
  async evaluateAll(
    @SdkEnvironment() env: SdkEnvironmentInfo,
    @Body() dto: EvaluateAllDto,
    @Req()
    req: {
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    },
  ) {
    const flags = await this.evaluationService.evaluateAllFlags(
      env.environmentId,
      dto.context,
      env.keyType,
    );

    for (const result of flags) {
      this.collector.record(result, {
        organizationId: env.organizationId,
        projectId: env.projectId,
        environmentId: env.environmentId,
        sdkKeyId: env.sdkKeyId,
        clientIp: req.ip,
        contextUserId: dto.context.userId,
      });
    }

    return { flags };
  }
}
