import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator lấy thông tin User/Session từ Better Auth.
 * Cách dùng:
 * 1. @ActiveUser() userAndSession: Toàn bộ object { user, session }
 * 2. @ActiveUser('user') user: Chỉ lấy thông tin User
 * 3. @ActiveUser('session') session: Chỉ lấy thông tin Session
 */
export const ActiveUser = createParamDecorator(
  (data: 'user' | 'session' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload) return null;

    return data ? userPayload[data] : userPayload;
  },
);
