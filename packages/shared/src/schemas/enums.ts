import { z } from 'zod';

export const flagTypeEnum = z.enum(['boolean', 'multivariate']);
export const flagStatusEnum = z.enum(['draft', 'active', 'archived']);
export const ruleTypeEnum = z.enum(['kill_switch', 'user', 'role', 'percentage']);
export const memberRoleEnum = z.enum(['admin', 'editor', 'viewer']);
export const actionTypeEnum = z.enum([
  'ORG_CREATE',
  'ORG_UPDATE',
  'ORG_DELETE',
  'PROJECT_CREATE',
  'PROJECT_UPDATE',
  'PROJECT_DELETE',
  'ENV_CREATE',
  'ENV_UPDATE',
  'ENV_DELETE',
  'ENV_KEY_ROTATE',
  'FLAG_CREATE',
  'FLAG_UPDATE',
  'FLAG_DELETE',
  'FLAG_ACTIVATE',
  'FLAG_ARCHIVE',
  'FLAG_TOGGLE',
  'RULE_CREATE',
  'RULE_UPDATE',
  'RULE_DELETE',
  'RULE_REORDER',
  'RULE_TOGGLE',
  'VARIATION_CREATE',
  'VARIATION_UPDATE',
  'VARIATION_DELETE',
  'SDK_KEY_CREATE',
  'SDK_KEY_REVOKE',
  'SDK_KEY_ROTATE',
  'MBR_INVITE',
  'MBR_REMOVE',
  'MBR_ROLE_CHANGE',
]);
export const entityTypeEnum = z.enum([
  'organization',
  'project',
  'environment',
  'feature_flag',
  'targeting_rule',
  'variation',
  'sdk_key',
]);
export const actorTypeEnum = z.enum(['user', 'system']);

export type FlagType = z.infer<typeof flagTypeEnum>;
export type FlagStatus = z.infer<typeof flagStatusEnum>;
export type RuleType = z.infer<typeof ruleTypeEnum>;
export type MemberRole = z.infer<typeof memberRoleEnum>;
export type ActionType = z.infer<typeof actionTypeEnum>;
export type EntityType = z.infer<typeof entityTypeEnum>;
export type ActorType = z.infer<typeof actorTypeEnum>;
