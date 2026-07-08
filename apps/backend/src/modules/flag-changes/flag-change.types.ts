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
  timestamp: string;
  /** Controls which SDK key types receive this event */
  visibility?: 'all' | 'client_only' | 'server_only';
  metadata?: {
    version?: number;
    isEnabled?: boolean;
  };
}
