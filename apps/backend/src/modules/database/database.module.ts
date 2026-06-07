import { Global, Module } from '@nestjs/common';
import { createDrizzleClient, type Database } from '../../db';

export const DATABASE = Symbol('DATABASE');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => createDrizzleClient(),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
