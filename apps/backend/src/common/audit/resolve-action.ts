import { type InferSelectModel } from 'drizzle-orm';
import {
  featureFlags,
  flagStates,
  targetingRules,
  sdkKeys,
  projects,
  environments,
  organizations,
} from '@/db/schema';

type FeatureFlagEntity = InferSelectModel<typeof featureFlags>;
type FlagStateEntity = InferSelectModel<typeof flagStates>;
type TargetingRuleEntity = InferSelectModel<typeof targetingRules>;
type SdkKeyEntity = InferSelectModel<typeof sdkKeys>;
type ProjectEntity = InferSelectModel<typeof projects>;
type EnvironmentEntity = InferSelectModel<typeof environments>;
type OrganizationEntity = InferSelectModel<typeof organizations>;

type BaseEntity = {
  id: string;
  deletedAt?: Date | string | null;
};

function isDeleted(
  before: BaseEntity | null,
  after: BaseEntity | null,
): boolean {
  if (before && !after) return true;
  if (before && after && !before.deletedAt && after.deletedAt) return true;
  return false;
}

export function resolveFlagAction(
  before: FeatureFlagEntity | null,
  after: FeatureFlagEntity | null,
): string {
  if (!before && after) return 'FLAG_CREATE';
  if (isDeleted(before, after)) return 'FLAG_DELETE';
  return 'FLAG_UPDATE';
}

export function resolveFlagStateAction(
  before: FlagStateEntity | null,
  after: FlagStateEntity | null,
): string {
  if (!before && after) return 'FLAG_STATE_CREATE';
  if (isDeleted(before, after)) return 'FLAG_STATE_DELETE';
  if (!before || !after) return 'FLAG_STATE_UPDATE';

  if (before.status !== after.status) {
    if (after.status === 'archived') return 'FLAG_ARCHIVE';
    if (after.status === 'active' && before.status === 'draft')
      return 'FLAG_ACTIVATE';
  }

  if (before.isEnabled !== after.isEnabled) return 'FLAG_TOGGLE';

  return 'FLAG_STATE_UPDATE';
}

export function resolveRuleAction(
  before: TargetingRuleEntity | null,
  after: TargetingRuleEntity | null,
): string {
  if (!before && after) return 'RULE_CREATE';
  if (isDeleted(before, after)) return 'RULE_DELETE';
  if (!before || !after) return 'RULE_UPDATE';

  if (before.isEnabled !== after.isEnabled) return 'RULE_TOGGLE';
  if (before.priority !== after.priority) return 'RULE_REORDER';

  return 'RULE_UPDATE';
}

export function resolveSdkKeyAction(
  before: SdkKeyEntity | null,
  after: SdkKeyEntity | null,
): string {
  if (!before && after) return 'SDK_KEY_CREATE';
  if (isDeleted(before, after)) return 'SDK_KEY_DELETE';
  if (before && after) {
    if (before.isActive && !after.isActive) return 'SDK_KEY_REVOKE';
    if (before.keyHash && after.keyHash && before.keyHash !== after.keyHash)
      return 'SDK_KEY_ROTATE';
    if (before.keyHint !== after.keyHint) return 'SDK_KEY_ROTATE';
    return 'SDK_KEY_UPDATE';
  }
  return 'SDK_KEY_UPDATE';
}

export function resolveProjectAction(
  before: ProjectEntity | null,
  after: ProjectEntity | null,
): string {
  if (!before && after) return 'PROJECT_CREATE';
  if (isDeleted(before, after)) return 'PROJECT_DELETE';
  return 'PROJECT_UPDATE';
}

export function resolveEnvironmentAction(
  before: EnvironmentEntity | null,
  after: EnvironmentEntity | null,
): string {
  if (!before && after) return 'ENV_CREATE';
  if (isDeleted(before, after)) return 'ENV_DELETE';
  return 'ENV_UPDATE';
}

export function resolveOrganizationAction(
  before: OrganizationEntity | null,
  after: OrganizationEntity | null,
): string {
  if (!before && after) return 'ORG_CREATE';
  if (isDeleted(before, after)) return 'ORG_DELETE';
  return 'ORG_UPDATE';
}
