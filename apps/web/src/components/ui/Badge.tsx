import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "green" | "yellow" | "red" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  accent: "bg-accent-dim text-accent border-accent/30",
  green: "bg-green-dim text-green border-green/30",
  yellow: "bg-[#1E1800] text-yellow border-yellow/30",
  red: "bg-red-dim text-red border-red/30",
  muted: "bg-surface2 text-text2 border-border2",
};

export function Badge({ variant = "muted", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[10px] px-[7px] py-[2px] rounded-[20px] border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export type { BadgeVariant, BadgeProps };
