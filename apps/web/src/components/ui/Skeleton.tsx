import { cn } from "@/lib/utils";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-card)",
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn("bg-surface2 relative overflow-hidden", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius:
          typeof borderRadius === "number"
            ? `${borderRadius}px`
            : borderRadius,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}

export type { SkeletonProps };
