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
  before: any | null,
  after: any | null,
): string {
  if (!before && after) return 'FLAG_CREATE';
  if (isDeleted(before, after)) return 'FLAG_DELETE';
  if (before && after) {
    if (before.visibility !== after.visibility) return 'FLAG_VISIBILITY_UPDATE';

    const rulesBefore = JSON.stringify(before.rules ?? []);
    const rulesAfter = JSON.stringify(after.rules ?? []);
    if (rulesBefore !== rulesAfter) return 'FLAG_RULE_UPDATE';

    const varBefore = JSON.stringify(before.variations ?? []);
    const varAfter = JSON.stringify(after.variations ?? []);
    if (varBefore !== varAfter) return 'FLAG_VARIATION_UPDATE';
  }
  return 'FLAG_UPDATE';
}

export function resolveFlagStateAction(
  before: FlagStateEntity | null,
  after: FlagStateEntity | null,
): string {
  if (isDeleted(before, after)) return 'FLAG_UPDATE';
  if (!before || !after) return 'FLAG_UPDATE';

  if (before.status !== after.status) {
    if (after.status === 'archived') return 'FLAG_ARCHIVE';
    if (after.status === 'draft' && before.status === 'archived') return 'FLAG_RESTORE';
    if (after.status === 'active' && before.status === 'draft')
      return 'FLAG_ACTIVATE';
  }

  if (before.isEnabled !== after.isEnabled) return 'FLAG_TOGGLE';

  return 'FLAG_UPDATE';
}

export function resolveRuleAction(
  before: TargetingRuleEntity | null,
  after: TargetingRuleEntity | null,
): string {
  return 'FLAG_RULE_UPDATE';
}

export function resolveSdkKeyAction(
  before: SdkKeyEntity | null,
  after: SdkKeyEntity | null,
): string {
  if (!before && after) return 'SDK_KEY_CREATE';
  if (isDeleted(before, after)) return 'SDK_KEY_REVOKE';
  if (before && after) {
    if (!before.isActive && after.isActive) return 'SDK_KEY_ENABLE';
    if (before.isActive && !after.isActive) return 'SDK_KEY_DISABLE';
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
