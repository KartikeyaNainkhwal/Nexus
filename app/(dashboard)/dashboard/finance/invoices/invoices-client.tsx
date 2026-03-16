"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Search, Filter, CheckCircle2, Send, Trash2 } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { InvoiceFormModal } from "./invoice-form-modal";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: string;
    currency: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;
    notes: string | null;
    dueDate: string;
    paidAt: string | null;
    sentAt: string | null;
    createdAt: string;
    client: { id: string; name: string; email: string; company: string | null };
    items: InvoiceItem[];
    createdBy: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    SENT: "bg-blue-50 text-blue-600 border-blue-200",
    PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
    OVERDUE: "bg-red-50 text-red-600 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function InvoicesClient() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const fetchInvoices = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        fetch(`/api/invoices?${params}`)
            .then((r) => r.json())
            .then((data) => setInvoices(Array.isArray(data) ? data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const handleMarkPaid = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PAID" }),
            });
            if (res.ok) {
                toast.success("Invoice marked as paid!");
                fetchInvoices();
            }
        } catch {
            toast.error("Failed to update invoice");
        }
    };

    const handleSend = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
            if (res.ok) {
                toast.success("Invoice marked as sent!");
                fetchInvoices();
            }
        } catch {
            toast.error("Failed to send invoice");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this invoice?")) return;
        try {
            const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Invoice deleted");
                fetchInvoices();
            }
        } catch {
            toast.error("Failed to delete invoice");
        }
    };

    const filtered = invoices.filter((inv) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.client.name.toLowerCase().includes(q) ||
            inv.client.email.toLowerCase().includes(q)
        );
    });

    const totalAmount = filtered.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = filtered.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.total, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Invoices" description="Create and manage professional invoices">
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                    New Invoice
                </Button>
            </PageHeader>

            {/* Summary Strip */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface border border-border shadow-sm">
                    <Receipt className="h-4 w-4 text-accent" />
                    <span className="text-xs font-black text-text-muted uppercase tracking-widest">{filtered.length} Total</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-black text-emerald-600">{formatCurrency(paidAmount)} Paid</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-black text-amber-600">{formatCurrency(totalAmount - paidAmount)} Pending</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-text-muted" />
                    {["", "DRAFT", "SENT", "PAID", "OVERDUE"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border transition-all",
                                statusFilter === s
                                    ? "bg-accent text-white border-accent shadow-md"
                                    : "bg-bg-surface text-text-muted border-border hover:border-accent/30"
                            )}
                        >
                            {s || "All"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card className="shadow-sm overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-bg-hover/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px]">Invoice</th>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px]">Client</th>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px]">Amount</th>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px]">Due Date</th>
                                <th className="px-6 py-4 font-bold text-text-muted uppercase tracking-wider text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-text-muted">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Receipt className="h-10 w-10 text-text-subtle" />
                                            <p className="text-sm font-bold text-text-muted">No invoices found</p>
                                            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
                                                Create Invoice
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-bg-hover/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-accent text-xs">{inv.invoiceNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-text-primary text-xs">{inv.client.name}</p>
                                            <p className="text-[10px] text-text-muted">{inv.client.company || inv.client.email}</p>
                                        </td>
                                        <td className="px-6 py-4 font-black text-text-primary text-xs">
                                            {formatCurrency(inv.total, inv.currency)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border", STATUS_COLORS[inv.status] || "")}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-tight",
                                                inv.status !== "PAID" && new Date(inv.dueDate) < new Date()
                                                    ? "text-red-500"
                                                    : "text-text-muted"
                                            )}>
                                                {format(new Date(inv.dueDate), "MMM d, yyyy")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 transition-all">
                                                {inv.status === "DRAFT" && (
                                                    <button onClick={() => handleSend(inv.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Send">
                                                        <Send className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                                                    <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors" title="Mark Paid">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showCreate && (
                <InvoiceFormModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); fetchInvoices(); }}
                />
            )}
        </div>
    );
}
