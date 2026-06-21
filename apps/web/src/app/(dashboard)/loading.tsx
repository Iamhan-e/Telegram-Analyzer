import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Dashboard-level loading state — preserves the sidebar shell.
 * Shows skeleton placeholders in the content area during navigation.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <Skeleton height="24px" width="200px" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="70%" />
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
    </div>
  );
}
