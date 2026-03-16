import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { ForceSignOut } from "@/components/auth/force-sign-out";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch organization data for the sidebar
  const orgFallback = { name: "Personal Workspace", plan: "FREE" };
  let organizationData = orgFallback;

  if (session.user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, plan: true },
    });
    if (org) {
      organizationData = org;
    } else {
      // The session has an orgId but the org doesn't exist in DB (likely wiped database)
      // Force log the user out so the stale session doesn't trap them in a broken state.
      return <ForceSignOut />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base text-text-primary">
      {/* Sidebar (hidden on mobile) */}
      <Sidebar user={session.user} organization={organizationData} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-[240px] max-md:mb-[64px] relative z-10">
        <Navbar user={session.user} />

        <main className="flex-1 overflow-y-auto scrollbar-thin relative z-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Navigation (hidden on desktop) */}
      <MobileNav />

      {/* Global Elements */}
      <div className="noise" />
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-50 z-[-1]" />
      <div className="glow-ambient-light" />
      <div className="glow-ambient-dark" />
    </div>
  );
}
