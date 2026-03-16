import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoice = await prisma.invoice.findFirst({
            where: { id, organizationId: session.user.organizationId },
            include: { client: true },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === "PAID") {
            return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
        }

        // Mark as sent
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: "SENT",
                sentAt: invoice.sentAt ?? new Date(),
            },
            include: { client: true, items: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[INVOICE_SEND]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
