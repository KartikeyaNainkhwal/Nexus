import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingContent } from "./landing-content";

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
