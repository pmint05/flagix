interface BaseEntity {
  id: string;
}

interface FeatureFlagEntity extends BaseEntity {
  organizationId: string;
  projectId: string;
  key: string;
  version: number;
}

interface FlagStateEntity extends BaseEntity {
  featureFlagId: string;
  environmentId: string;
  isEnabled: boolean;
  status: string;
}

interface TargetingRuleEntity extends BaseEntity {
  organizationId: string;
  featureFlagId: string;
  ruleType: string;
  priority: string;
  isEnabled: boolean;
}

interface SdkKeyEntity extends BaseEntity {
  organizationId: string;
  environmentId: string;
  name: string;
  keyHint: string;
  type: string;
  isActive: boolean;
}

interface ProjectEntity extends BaseEntity {
  organizationId: string;
  name: string;
  slug: string;
}

interface EnvironmentEntity extends BaseEntity {
  projectId: string;
  name: string;
  slug: string;
}

interface OrganizationEntity extends BaseEntity {
  name: string;
  slug: string;
}

export function resolveFlagAction(
  before: FeatureFlagEntity | null,
  after: FeatureFlagEntity | null,
): string {
  if (!before && after) return 'FLAG_CREATE';
  if (before && !after) return 'FLAG_DELETE';
  return 'FLAG_UPDATE';
}

export function resolveFlagStateAction(
  before: FlagStateEntity | null,
  after: FlagStateEntity | null,
): string {
  if (!before && after) return 'FLAG_STATE_CREATE';
  if (before && !after) return 'FLAG_STATE_DELETE';
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
  if (before && !after) return 'RULE_DELETE';
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
  if (before && !after) return 'SDK_KEY_REVOKE';
  if (before && after) return 'SDK_KEY_ROTATE';
  return 'SDK_KEY_CREATE';
}

export function resolveProjectAction(
  before: ProjectEntity | null,
  after: ProjectEntity | null,
): string {
  if (!before && after) return 'PROJECT_CREATE';
  if (before && !after) return 'PROJECT_DELETE';
  return 'PROJECT_UPDATE';
}

export function resolveEnvironmentAction(
  before: EnvironmentEntity | null,
  after: EnvironmentEntity | null,
): string {
  if (!before && after) return 'ENV_CREATE';
  if (before && !after) return 'ENV_DELETE';
  return 'ENV_UPDATE';
}

export function resolveOrganizationAction(
  before: OrganizationEntity | null,
  after: OrganizationEntity | null,
): string {
  if (!before && after) return 'ORG_CREATE';
  if (before && !after) return 'ORG_DELETE';
  return 'ORG_UPDATE';
}
