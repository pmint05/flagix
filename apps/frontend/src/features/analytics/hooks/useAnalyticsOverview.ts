import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContextStore } from "@/stores";
import type { OverviewResponse, AnalyticsTimeRange } from "../types/analytics";

export const OVERVIEW_KEY = ["analytics", "overview"] as const;

export function useAnalyticsOverview(range: AnalyticsTimeRange = {}) {
  const orgId = useContextStore((s) => s.selectedOrganization?.id);

  const searchParams = new URLSearchParams();
  if (range.from) searchParams.append("from", range.from);
  if (range.to) searchParams.append("to", range.to);
  if (range.granularity) searchParams.append("granularity", range.granularity);

  return useQuery({
    queryKey: [...OVERVIEW_KEY, orgId, range],
    queryFn: () =>
      api.get<OverviewResponse>(
        `organizations/${orgId}/analytics/overview`,
        { searchParams },
      ),
    enabled: !!orgId,
  });
}
