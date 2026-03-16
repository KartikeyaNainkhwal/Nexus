import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id || !session.user.organizationId) {
        redirect("/login");
    }

    // Restrict the finance dashboard strictly to Owners and Admins
    if (session.user.role === "MEMBER") {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
