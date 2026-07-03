import { Controller, Get, Param, Sse, Query, UseGuards } from '@nestjs/common';
import { Observable, map, filter } from 'rxjs';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrgRolesGuard } from '@/common/guards/org-roles.guard';
import { Auth } from '@/common/decorators/auth.decorator';
import {
  EvaluationStreamService,
  EvaluationStreamEvent,
} from './evaluation-stream.service';

interface StreamQuery {
  flagKey?: string;
  environmentId?: string;
  projectId?: string;
}

@ApiTags('Analytics')
@Controller()
@UseGuards(OrgRolesGuard)
@Auth()
export class EvaluationStreamController {
  constructor(private readonly streamService: EvaluationStreamService) {}

  @Get('organizations/:orgId/analytics/stream')
  @Sse()
  @ApiOperation({
    summary: 'Stream real-time evaluation events for an organization',
  })
  @ApiParam({ name: 'orgId', required: true })
  @Throttle({ sse: { ttl: 60_000, limit: 100 } })
  stream(
    @Param('orgId') orgId: string,
    @Query() query: StreamQuery,
  ): Observable<MessageEvent> {
    const observable = this.streamService.subscribe(orgId);

    return observable.pipe(
      filter((event) => {
        if (query.flagKey && event.flagKey !== query.flagKey) return false;
        if (query.environmentId && event.environmentId !== query.environmentId)
          return false;
        if (query.projectId && event.projectId !== query.projectId) return false;
        return true;
      }),
      map(
        (event: EvaluationStreamEvent) =>
          ({
            data: {
              ...event,
              contextUserHash: event.contextUserHash
                ? `${event.contextUserHash.substring(0, 8)}...`
                : null,
            },
            type: 'evaluation',
          }) as MessageEvent,
      ),
    );
  }
}
