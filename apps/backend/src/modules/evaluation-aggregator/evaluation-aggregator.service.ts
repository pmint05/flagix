import { Injectable, Logger, Inject, type OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { DATABASE } from '@/modules/database/database.module';
import type { Database } from '@/db';

const HOURLY_BATCH_SIZE = 10000;

@Injectable()
export class EvaluationAggregatorService implements OnModuleInit {
  private readonly logger = new Logger(EvaluationAggregatorService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  onModuleInit() {
    this.logger.log('EvaluationAggregatorService initialized');
  }

  @Cron('0 * * * *')
  async aggregateHourly() {
    this.logger.log('Starting hourly aggregation');
    const bucket = new Date();
    bucket.setMinutes(0, 0, 0);

    try {
      let offset = 0;
      let totalRows = 0;

      while (true) {
        const inserted = await this.aggregateHourlyBatch(
          bucket,
          offset,
          HOURLY_BATCH_SIZE,
        );
        totalRows += inserted;
        if (inserted < HOURLY_BATCH_SIZE) break;
        offset += HOURLY_BATCH_SIZE;
      }

      this.logger.log(
        `Hourly aggregation complete — grouped ${totalRows} events`,
      );
    } catch (err) {
      this.logger.error('Hourly aggregation failed', err);
    }
  }

  private async aggregateHourlyBatch(
    bucket: Date,
    offset: number,
    limit: number,
  ): Promise<number> {
    const bucketEnd = new Date(bucket.getTime() + 60 * 60 * 1000);

    const result = await this.db.execute(sql`
      INSERT INTO evaluation_stats_hourly (
        organization_id, project_id, environment_id, feature_flag_id,
        variation_id, evaluation_reason, unique_users, total_count, bucket
      )
      SELECT
        evt.organization_id,
        evt.project_id,
        evt.environment_id,
        evt.feature_flag_id,
        evt.variation_id,
        evt.evaluation_reason,
        COUNT(DISTINCT evt.context_user_hash)::bigint,
        COUNT(*)::bigint,
        ${bucket.toISOString()}::timestamptz
      FROM evaluation_events evt
      WHERE evt.created_at >= ${bucket.toISOString()}::timestamptz
        AND evt.created_at < ${bucketEnd.toISOString()}::timestamptz
      GROUP BY
        evt.organization_id,
        evt.project_id,
        evt.environment_id,
        evt.feature_flag_id,
        evt.variation_id,
        evt.evaluation_reason
      ON CONFLICT (
        organization_id, feature_flag_id, environment_id,
        variation_id, evaluation_reason, bucket
      ) DO UPDATE SET
        total_count = evaluation_stats_hourly.total_count + EXCLUDED.total_count,
        unique_users = GREATEST(evaluation_stats_hourly.unique_users, EXCLUDED.unique_users)
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return result.rowCount ?? 0;
  }

  @Cron('0 2 * * *')
  async rollupDaily() {
    this.logger.log('Starting daily rollup');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const dayEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);

      const result = await this.db.execute(sql`
        INSERT INTO evaluation_stats_daily (
          organization_id, feature_flag_id, environment_id,
          evaluation_reason, unique_users, total_count, bucket
        )
        SELECT
          h.organization_id,
          h.feature_flag_id,
          h.environment_id,
          h.evaluation_reason,
          SUM(h.unique_users)::bigint,
          SUM(h.total_count)::bigint,
          ${yesterday.toISOString()}::timestamptz
        FROM evaluation_stats_hourly h
        WHERE h.bucket >= ${yesterday.toISOString()}::timestamptz
          AND h.bucket < ${dayEnd.toISOString()}::timestamptz
        GROUP BY
          h.organization_id,
          h.feature_flag_id,
          h.environment_id,
          h.evaluation_reason
        ON CONFLICT (
          organization_id, feature_flag_id, environment_id,
          evaluation_reason, bucket
        ) DO UPDATE SET
          total_count = evaluation_stats_daily.total_count + EXCLUDED.total_count,
          unique_users = GREATEST(evaluation_stats_daily.unique_users, EXCLUDED.unique_users)
      `);

      this.logger.log(
        `Daily rollup complete — ${result.rowCount ?? 0} rows upserted`,
      );
    } catch (err) {
      this.logger.error('Daily rollup failed', err);
    }
  }

  @Cron('0 3 * * *')
  async purgeOldEvents() {
    const retentionDays = parseInt(
      process.env.EVALUATION_EVENT_RETENTION_DAYS ?? '30',
      10,
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    this.logger.log(
      `Starting purge of evaluation events older than ${retentionDays} days (before ${cutoff.toISOString()})`,
    );

    try {
      while (true) {
        const result = await this.db.execute(sql`
          DELETE FROM evaluation_events
          WHERE id IN (
            SELECT id FROM evaluation_events
            WHERE created_at < ${cutoff.toISOString()}::timestamptz
            LIMIT 5000
          )
        `);

        const deleted = result.rowCount ?? 0;
        this.logger.log(`Purged ${deleted} old evaluation events`);

        if (deleted === 0) break;
      }

      await this.purgeOrphanedPartitions(cutoff);

      this.logger.log('Purge complete');
    } catch (err) {
      this.logger.error('Purge failed', err);
    }
  }

  private async purgeOrphanedPartitions(cutoff: Date) {
    const retentionMinDate = cutoff.toISOString().slice(0, 7);
    try {
      const result = await this.db.execute(sql`
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'evaluation_events_%'
          AND tablename < ${`evaluation_events_${retentionMinDate.replace('-', '_')}`}
      `);

      const rows = result.rows as { tablename: string }[];
      for (const row of rows) {
        this.logger.log(`Dropping orphaned partition: ${row.tablename}`);
        await this.db.execute(
          sql.raw(`DROP TABLE IF EXISTS "${row.tablename}"`),
        );
      }
    } catch (err) {
      this.logger.error('Failed to drop orphaned partitions', err);
    }
  }

  @Cron('0 0 1 * *')
  async createNextPartition() {
    this.logger.log('Creating next-month partition for evaluation_events');

    try {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);

      const partitionName = `evaluation_events_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const fromDate = nextMonth.toISOString();
      const toDate = nextNextMonth.toISOString();

      const existsResult = await this.db.execute(
        sql.raw(
          `SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = '${partitionName}')`,
        ),
      );
      const exists = (existsResult.rows[0] as any)?.exists ?? false;

      if (exists) {
        this.logger.log(`Partition ${partitionName} already exists`);
        return;
      }

      await this.db.execute(
        sql.raw(
          `CREATE TABLE IF NOT EXISTS "${partitionName}" PARTITION OF evaluation_events FOR VALUES FROM ('${fromDate}') TO ('${toDate}')`,
        ),
      );

      this.logger.log(`Created partition: ${partitionName}`);
    } catch (err) {
      this.logger.error('Failed to create next-month partition', err);
    }
  }
}
