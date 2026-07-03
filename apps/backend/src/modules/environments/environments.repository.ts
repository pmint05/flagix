import { Inject, Injectable } from '@nestjs/common';
import { environments, featureFlags, flagStates, variations, sdkKeys, targetingRules } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { DATABASE } from '@/modules/database/database.module';
import { type Database } from '@/db';
import type { CreateEnvironmentDto } from './dto/create-environment.dto';
import type { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsRepository {
	constructor(@Inject(DATABASE) private readonly db: Database) {}

	async findById(id: string) {
		const [env] = await this.db
			.select()
			.from(environments)
			.where(and(eq(environments.id, id), isNull(environments.deletedAt)))
			.limit(1);
		return env ?? null;
	}

	async findAllForProject(projectId: string) {
		return this.db
			.select()
			.from(environments)
			.where(
				and(
					eq(environments.projectId, projectId),
					isNull(environments.deletedAt),
				),
			);
	}

	async findByProjectAndSlug(projectId: string, slug: string) {
		const [env] = await this.db
			.select()
			.from(environments)
			.where(
				and(
					eq(environments.projectId, projectId),
					eq(environments.slug, slug),
					isNull(environments.deletedAt),
				),
			)
			.limit(1);
		return env ?? null;
	}

	async create(
		input: CreateEnvironmentDto & { projectId: string; organizationId: string },
		actorId?: string,
	) {
		return this.db.transaction(async (tx) => {
			// 1. Create the environment
			const [env] = await tx
				.insert(environments)
				.values({
					organizationId: input.organizationId,
					projectId: input.projectId,
					name: input.name,
					slug: input.slug!,
					type: input.type ?? 'development',
					description: input.description ?? null,
					createdBy: actorId ?? null,
				})
				.returning();

			// 2. Fetch all feature flags for this project
			const flags = await tx
				.select()
				.from(featureFlags)
				.where(
					and(
						eq(featureFlags.projectId, input.projectId),
						isNull(featureFlags.deletedAt),
					),
				);

			if (flags.length > 0) {
				// 3. For each flag, find its variations to get default / off variations
				const flagIds = flags.map((f) => f.id);
				const flagVariations = await tx
					.select()
					.from(variations)
					.where(
						and(
							inArray(variations.featureFlagId, flagIds),
							isNull(variations.deletedAt),
						),
					);

				// Group variations by flag
				const variationsByFlag = new Map<string, typeof flagVariations>();
				for (const v of flagVariations) {
					const list = variationsByFlag.get(v.featureFlagId) ?? [];
					list.push(v);
					variationsByFlag.set(v.featureFlagId, list);
				}

				// 4. Construct default states
				const statesToInsert = flags.map((flag) => {
					const vars = variationsByFlag.get(flag.id) ?? [];
					const defaultVar = vars.find((v) => v.isDefault) ?? vars[0];
					return {
						organizationId: input.organizationId,
						featureFlagId: flag.id,
						environmentId: env.id,
						isEnabled: false,
						status: 'draft',
						defaultVariationId: defaultVar?.id || null,
						offVariationId: defaultVar?.id || null,
						createdBy: actorId ?? null,
					};
				});

				// 5. Bulk insert flag states
				await tx.insert(flagStates).values(statesToInsert);
			}

			return env;
		});
	}

	async update(id: string, input: UpdateEnvironmentDto, actorId?: string) {
		const [env] = await this.db
			.update(environments)
			.set({
				...(input.name !== undefined && { name: input.name }),
				...(input.type !== undefined && { type: input.type }),
				...(input.isActive !== undefined && { isActive: input.isActive }),
				...(input.description !== undefined && {
					description: input.description,
				}),
				updatedBy: actorId ?? null,
			})
			.where(eq(environments.id, id))
			.returning();
		return env ?? null;
	}

	async softDelete(id: string, actorId?: string) {
		return this.db.transaction(async (tx) => {
			const deletedAt = new Date();
			// 1. Soft-delete environment
			const [env] = await tx
				.update(environments)
				.set({ deletedAt, deletedBy: actorId ?? null })
				.where(eq(environments.id, id))
				.returning();

			if (!env) return null;

			// 2. Soft-delete SDK keys under this environment
			await tx
				.update(sdkKeys)
				.set({ deletedAt, deletedBy: actorId ?? null })
				.where(eq(sdkKeys.environmentId, id));

			// 3. Soft-delete flag states under this environment
			await tx
				.update(flagStates)
				.set({ deletedAt })
				.where(eq(flagStates.environmentId, id));

			// 4. Soft-delete targeting rules under this environment
			await tx
				.update(targetingRules)
				.set({ deletedAt })
				.where(eq(targetingRules.environmentId, id));

			return env;
		});
	}
}
