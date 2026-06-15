import { Module, SetMetadata } from '@nestjs/common';

export const AllowAnonymous = () => SetMetadata('AllowAnonymous', true);

@Module({})
export class AuthModule {
  static forRoot() {
    return { module: AuthModule };
  }
  static forRootAsync() {
    return { module: AuthModule };
  }
}
