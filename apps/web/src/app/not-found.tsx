import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Custom 404 page — uses the design system instead of the Next.js default.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-mono text-[48px] text-accent mb-4">404</h1>
      <p className="font-sans text-[14px] text-text2 mb-2">
        This page could not be found.
      </p>
      <p className="font-sans text-[12px] text-text3 max-w-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button variant="primary" size="sm">
          Back to dashboard
        </Button>
      </Link>
    </main>
  );
}
