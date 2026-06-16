import { Global, Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { createDrizzleClient, type Database } from '@/db';

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
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async onModuleInit() {
    try {
      await this.db.execute('SELECT 1');
      this.logger.log('[DATABASE] Successfully connected to the database');
    } catch (error) {
      this.logger.error(
        '[DATABASE] Failed to connect to the database. Exiting...',
        error,
      );
    }
  }
}
