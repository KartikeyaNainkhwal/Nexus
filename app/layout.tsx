import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { CommandPalette } from "@/components/shared/CommandPalette";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Nexus — SaaS Project Management for Teams",
    template: "%s | Nexus",
  },
  description:
    "Nexus is a powerful multi-tenant workspace for project management. Collaborate, track, and ship faster with Kanban boards and real-time dashboards.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nexus.app"),
  keywords: ["SaaS", "Project Management", "Multi-tenant", "Team Collaboration"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://nexus.app",
    siteName: "Nexus",
    title: "Nexus — SaaS Project Management for Teams",
    description: "Collaborate, track, and ship faster with Nexus.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Nexus" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — SaaS Project Management for Teams",
    description:
      "Collaborate, track, and ship faster with Nexus.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
