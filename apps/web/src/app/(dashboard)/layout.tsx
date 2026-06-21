import AppShell from "@/components/layout/AppShell";
import { ApiKeyBanner } from "@/components/ApiKeyBanner";

/**
 * Dashboard layout — wraps all /dashboard/* routes.
 *
 * Uses the AppShell from FE-003 for the persistent sidebar + topbar shell.
 * The ApiKeyBanner warns users who haven't connected their Telegram API key.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <ApiKeyBanner />
      <div className="p-6">{children}</div>
    </AppShell>
  );
}
