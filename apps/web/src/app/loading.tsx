import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Root-level loading state — shown during page transitions and initial loads.
 * Uses skeleton placeholders matching the design system, not a spinner.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <Skeleton height="24px" width="180px" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="85%" />
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
    </div>
  );
}
