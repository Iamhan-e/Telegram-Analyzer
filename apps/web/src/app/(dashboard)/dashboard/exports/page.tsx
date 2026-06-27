import { EmptyState } from "@/components/ui/EmptyState";

export default function ExportsPage() {
  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Exports</h1>
      <EmptyState
        icon={<span className="font-mono text-[48px] text-text3 opacity-20">◪</span>}
        title="No exports yet"
        description="Generate CSV or JSON exports from any channel&apos;s detail page."
      />
    </div>
  );
}
