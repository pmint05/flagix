export type FlagChangeEventType =
  | 'flag.created'
  | 'flag.updated'
  | 'flag.toggled'
  | 'flag.archived'
  | 'flag.restored'
  | 'flag.deleted'
  | 'rule.created'
  | 'rule.updated'
  | 'rule.deleted'
  | 'variation.created'
  | 'variation.updated'
  | 'variation.deleted';

export interface FlagChangeEvent {
  type: FlagChangeEventType;
  flagKey: string;
  environmentId: string;
  timestamp: string;
  // Thin payload: only IDs/Keys of changed sub-entities, no sensitive data
  metadata?: {
    ruleId?: string;
    variationId?: string;
    version?: number;
    isEnabled?: boolean;
  };
}
