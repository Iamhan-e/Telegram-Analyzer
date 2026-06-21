import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state placeholder for pages with no data.
 * Used when: no channels tracked, no messages, no media, no exports, etc.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text3 opacity-40">{icon}</div>
      )}
      <h3 className="font-mono text-[13px] text-text2 mb-2">{title}</h3>
      {description && (
        <p className="font-sans text-[12px] text-text3 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export type { EmptyStateProps };
