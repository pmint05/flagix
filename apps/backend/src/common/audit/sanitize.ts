interface SanitizeOptions {
  excludeKeys?: string[];
  pickKeys?: string[];
}

function sanitizeEntity<T>(
  entity: T,
  options: SanitizeOptions = {},
): Partial<T> {
  const { excludeKeys = [], pickKeys } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(
    entity as Record<string, unknown>,
  )) {
    if (pickKeys && !pickKeys.includes(key)) continue;
    if (excludeKeys.includes(key)) continue;

    result[key] = value;
  }

  return result as Partial<T>;
}

export function sanitizeFlag<T>(flag: T) {
  return sanitizeEntity(flag, {
    excludeKeys: ['organizationId'],
  });
}

export function sanitizeSdkKey<T>(sdkKey: T) {
  return sanitizeEntity(sdkKey, {
    excludeKeys: ['keyHash', 'organizationId'],
  });
}

export function sanitizeRule<T>(rule: T) {
  return sanitizeEntity(rule, {
    excludeKeys: ['organizationId'],
  });
}

export function sanitizeProject<T>(project: T) {
  return sanitizeEntity(project, {
    excludeKeys: ['organizationId'],
  });
}

export function sanitizeEnvironment<T>(env: T) {
  return sanitizeEntity(env, {
    excludeKeys: ['organizationId'],
  });
}

export function sanitizeOrganization<T>(org: T) {
  return sanitizeEntity(org);
}
