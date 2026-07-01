import AppShell from "@/components/layout/AppShell";
import { ApiKeyBanner } from "@/components/ApiKeyBanner";
import { Providers } from "@/components/Providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppShell>
        <ApiKeyBanner />
        <div className="p-6">{children}</div>
      </AppShell>
    </Providers>
  );
}
