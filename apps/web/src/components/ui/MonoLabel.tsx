import { cn } from "@/lib/utils";

interface MonoLabelProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "label" | "h2" | "h3";
}

export function MonoLabel({ children, className, as: Tag = "span" }: MonoLabelProps) {
  return (
    <Tag
      className={cn(
        "font-mono text-[9px] uppercase tracking-[0.1em] text-text3",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export type { MonoLabelProps };
