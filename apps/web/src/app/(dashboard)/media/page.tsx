import { EmptyState } from "@/components/ui/EmptyState";

export default function MediaPage() {
  return (
    <div>
      <h1 className="font-mono text-[15px] text-text mb-6">Media</h1>
      <EmptyState
        icon={<span className="font-mono text-[48px] text-text3 opacity-20">◨</span>}
        title="Media gallery"
        description="Select a channel to browse its media files."
      />
    </div>
  );
}
