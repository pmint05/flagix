import {
  Controller,
  Get,
  Sse,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Throttle } from '@nestjs/throttler';
import { SdkKeyGuard } from '@/common/guards/sdk-key.guard';
import { FlagChangePublisher } from './flag-change.publisher';
import { FlagChangeEvent, FlagChangeEventType } from './flag-change.types';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

interface RequestWithSdkEnv {
  sdkEnvironment?: {
    environmentId: string;
    organizationId: string;
    projectId: string;
  };
}

interface FlagChangesQuery {
  flagKey?: string;
  eventTypes?: string;
}

@ApiTags('Flag Changes')
@Controller('flags')
@UseGuards(SdkKeyGuard)
export class FlagChangesController {
  constructor(private readonly publisher: FlagChangePublisher) {}

  @Get('stream')
  @Sse('stream')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Stream real-time flag change events for an environment',
  })
  @ApiHeader({
    name: 'X-SDK-Key',
    required: true,
    description: 'SDK Key for environment authentication',
  })
  @Throttle({ sse: { ttl: 60_000, limit: 100 } })
  stream(
    @Request() req: RequestWithSdkEnv,
    @Query() query: FlagChangesQuery,
  ): Observable<{ data: FlagChangeEvent; type?: string }> {
    const environmentId = req.sdkEnvironment!.environmentId;
    const eventTypes = query.eventTypes
      ? (query.eventTypes.split(',') as FlagChangeEventType[])
      : undefined;

    return this.publisher
      .subscribe(environmentId, {
        eventTypes,
        flagKey: query.flagKey,
      })
      .pipe(
        map((event: FlagChangeEvent) => ({
          data: event,
          type: event.type,
        })),
      );
  }
}
