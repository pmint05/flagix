import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useContextStore } from "@/stores";
import type { OverviewResponse, AnalyticsTimeRange } from "../types/analytics";

export function useProjectAnalytics(
  projectId: string | undefined,
  range: AnalyticsTimeRange = {},
  environmentIds?: string[],
) {
  const orgId = useContextStore((s) => s.selectedOrganization?.id);

  const searchParams = new URLSearchParams();
  if (range.from) searchParams.append("from", range.from);
  if (range.to) searchParams.append("to", range.to);
  if (range.granularity) searchParams.append("granularity", range.granularity);
  if (environmentIds && environmentIds.length > 0) {
    searchParams.append("environmentIds", environmentIds.join(","));
  }

  return useQuery({
    queryKey: ["analytics", "project-overview", orgId, projectId, range, environmentIds],
    queryFn: () =>
      api.get<OverviewResponse>(
        `organizations/${orgId}/projects/${projectId}/analytics/overview`,
        { searchParams },
      ),
    enabled: !!orgId && !!projectId,
  });
}
