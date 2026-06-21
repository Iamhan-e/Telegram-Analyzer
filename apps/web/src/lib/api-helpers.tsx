"use client";

import { useToast } from "@/components/ui/Toast";
import { Skeleton, type SkeletonProps } from "@/components/ui/Skeleton";

// ── Types ───────────────────────────────────────────────────────────────────

/** Reusable props for any component that fetches data. */
interface DataLoaderProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyState?: React.ReactNode;
  /** Skeleton shapes to render while loading. Pass an array of skeleton props. */
  skeletons?: SkeletonProps[];
  children: React.ReactNode;
}

// ── DataLoader — consistent loading / error / empty handling ───────────────

/**
 * Wraps any data-driven component with consistent:
 * - Loading: skeleton placeholders (not spinners)
 * - Error: toast notification (auto-fired)
 * - Empty: custom empty-state slot
 *
 * Usage:
 * ```tsx
 * <DataLoader
 *   isLoading={channelsQuery.isLoading}
 *   error={channelsQuery.error}
 *   isEmpty={!channelsQuery.data || channelsQuery.data.length === 0}
 *   emptyState={<EmptyState title="No channels" />}
 *   skeletons={[
 *     { height: "40px" },
 *     { height: "40px" },
 *     { height: "40px" },
 *   ]}
 * >
 *   <ChannelList channels={channelsQuery.data} />
 * </DataLoader>
 * ```
 */
export function DataLoader({
  isLoading,
  error,
  isEmpty,
  emptyState,
  skeletons = [{ height: "48px" }, { height: "48px" }, { height: "48px" }],
  children,
}: DataLoaderProps) {
  const toast = useToast();

  // Show toast on API errors
  if (error) {
    toast.error(error.message || "An unexpected error occurred");
  }

  // Loading state — show skeleton placeholders
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {skeletons.map((props, i) => (
          <Skeleton key={i} {...props} />
        ))}
      </div>
    );
  }

  // Error with no data to show
  if (error && isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center">
          <span className="font-mono text-[16px] text-red">!</span>
        </div>
        <h3 className="font-mono text-[13px] text-text2 mb-2">
          Failed to load data
        </h3>
        <p className="font-sans text-[12px] text-text3 max-w-sm">
          {error.message || "Please try again later."}
        </p>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return <>{emptyState}</>;
  }

  // Happy path
  return <>{children}</>;
}

// ── Re-export for convenience ──────────────────────────────────────────────

export type { DataLoaderProps, SkeletonProps };
