/**
 * Deterministic hash of the evaluation context.
 * Currently uses sorted JSON stringification.
 */
export function hashContext(context: any): string {
  if (!context) return '';
  const sorted = Object.keys(context)
    .sort()
    .reduce((acc, key) => {
      acc[key] = context[key];
      return acc;
    }, {} as any);
  return JSON.stringify(sorted);
}
