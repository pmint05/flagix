import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SdkEnvironmentInfo {
  environmentId: string;
  organizationId: string;
  projectId: string;
  keyType: 'client' | 'server';
  sdkKeyId: string;
}

interface RequestWithSdkEnv {
  sdkEnvironment: SdkEnvironmentInfo;
}

export const SdkEnvironment = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SdkEnvironmentInfo => {
    const request = ctx.switchToHttp().getRequest<RequestWithSdkEnv>();
    return request.sdkEnvironment;
  },
);
