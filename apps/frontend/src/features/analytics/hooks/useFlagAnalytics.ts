import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContextStore } from "@/stores";
import type { FlagAnalyticsResponse, AnalyticsTimeRange } from "../types/analytics";

export const ANALYTICS_KEY = ["analytics"] as const;

export function useFlagAnalytics(
  flagId: string,
  range: AnalyticsTimeRange = {},
  environmentId?: string,
) {
  const orgId = useContextStore((s) => s.selectedOrganization?.id);

  const searchParams = new URLSearchParams();
  if (range.from) searchParams.append("from", range.from);
  if (range.to) searchParams.append("to", range.to);
  if (range.granularity) searchParams.append("granularity", range.granularity);
  if (environmentId) searchParams.append("environmentId", environmentId);

  return useQuery({
    queryKey: [...ANALYTICS_KEY, orgId, flagId, range, environmentId],
    queryFn: () =>
      api.get<FlagAnalyticsResponse>(
        `organizations/${orgId}/analytics/flags/${flagId}`,
        { searchParams },
      ),
    enabled: !!orgId && !!flagId,
  });
}
