import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { sdkKeys, environments } from '@/db/schema';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import { hashSdkKey } from '@/common/utils/crypto';

interface RequestWithSdkEnv {
  headers: Record<string, string | string[] | undefined>;
  sdkEnvironment?: {
    environmentId: string;
    organizationId: string;
    projectId: string;
  };
}

@Injectable()
export class SdkKeyGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    
    let rawKey = request.headers['x-sdk-key'] as string | undefined;

    // Special case: Allow query param for SSE stream endpoint (browser EventSource support)
    const isSseStream = request.path?.endsWith('/flags/stream') || request.url?.includes('/flags/stream');
    if (!rawKey && isSseStream) {
      rawKey = request.query?.sdkKey as string | undefined;
    }

    if (!rawKey) {
      throw new UnauthorizedException(
        isSseStream 
          ? 'Missing X-SDK-Key header or sdkKey query parameter' 
          : 'Missing X-SDK-Key header'
      );
    }

    const keyHash = hashSdkKey(rawKey);

    const [sdkKey] = await this.db
      .select()
      .from(sdkKeys)
      .where(and(eq(sdkKeys.keyHash, keyHash), isNull(sdkKeys.deletedAt)))
      .limit(1);

    if (!sdkKey) {
      throw new UnauthorizedException('Invalid SDK key');
    }

    if (!sdkKey.isActive) {
      throw new UnauthorizedException('SDK key has been revoked');
    }

    const [env] = await this.db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.id, sdkKey.environmentId),
          isNull(environments.deletedAt),
        ),
      )
      .limit(1);

    if (!env) {
      throw new UnauthorizedException('Environment not found');
    }

    request.sdkEnvironment = {
      environmentId: sdkKey.environmentId,
      organizationId: sdkKey.organizationId,
      projectId: env.projectId,
    };

    return true;
  }
}
