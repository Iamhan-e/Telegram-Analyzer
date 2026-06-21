import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Self-hosted Inter — avoids next/font/google build-time network dependency.
 * Font files come from @fontsource/inter (installed in node_modules).
 * Weights: 400 (regular), 500 (medium), 600 (semibold) — latin subset only.
 */
const inter = localFont({
  src: [
    {
      path: "../../../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Self-hosted JetBrains Mono — avoids next/font/google build-time network dependency.
 * Font files come from @fontsource/jetbrains-mono.
 * Weights: 400 (regular), 500 (medium) — latin subset only.
 */
const jetbrainsMono = localFont({
  src: [
    {
      path: "../../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Telegram Analyzer",
  description: "A BYOAK SaaS for analyzing Telegram channel data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable)}>
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
