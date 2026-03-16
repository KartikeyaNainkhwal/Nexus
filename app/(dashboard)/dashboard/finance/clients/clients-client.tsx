"use client";

import { useEffect, useState } from "react";
import { Plus, UserCircle, Search, Mail, Building2, Trash2, Edit3 } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, CURRENCY_LIST } from "@/lib/currency";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Client {
    id: string;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
    notes: string | null;
    createdAt: string;
    invoiceCount: number;
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
}

export function ClientsClient() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState<Client | null>(null);

    const fetchClients = () => {
        setLoading(true);
        fetch("/api/clients")
            .then((r) => r.json())
            .then((data) => setClients(Array.isArray(data) ? data : []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchClients(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this client and all associated invoices?")) return;
        try {
            const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Client deleted"); fetchClients(); }
        } catch { toast.error("Failed to delete"); }
    };

    const filtered = clients.filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company?.toLowerCase().includes(q) ?? false);
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <PageHeader heading="Clients" description="Your client directory">
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditClient(null); setShowModal(true); }}>
                    Add Client
                </Button>
            </PageHeader>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                />
            </div>

            {/* Client Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[200px] bg-bg-surface border border-border rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center">
                    <UserCircle className="h-12 w-12 text-text-subtle mx-auto mb-4" />
                    <p className="text-sm font-bold text-text-muted mb-4">No clients yet</p>
                    <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditClient(null); setShowModal(true); }}>
                        Add Your First Client
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((client) => (
                        <Card key={client.id} className="p-6 group hover:border-accent/40 shadow-sm hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-accent to-[#8b5cf6] flex items-center justify-center text-white text-sm font-black shadow-md">
                                        {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-primary text-sm">{client.name}</h3>
                                        {client.company && <p className="text-[10px] font-bold text-text-muted flex items-center gap-1"><Building2 className="h-3 w-3" /> {client.company}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditClient(client); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-accent/10 text-text-muted hover:text-accent transition-colors">
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-5">
                                <Mail className="h-3 w-3" /> {client.email}
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                                <div>
                                    <p className="text-[9px] font-black text-text-subtle uppercase tracking-widest">Invoiced</p>
                                    <p className="text-sm font-black text-text-primary mt-0.5">{formatCurrency(client.totalInvoiced, client.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Paid</p>
                                    <p className="text-sm font-black text-emerald-600 mt-0.5">{formatCurrency(client.totalPaid, client.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
                                    <p className="text-sm font-black text-amber-600 mt-0.5">{formatCurrency(client.totalPending, client.currency)}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <Badge className="bg-bg-hover text-text-muted border-border text-[9px]">
                                    {client.invoiceCount} invoices
                                </Badge>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showModal && (
                <ClientFormModal
                    client={editClient}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchClients(); }}
                />
            )}
        </div>
    );
}

function ClientFormModal({ client, onClose, onSuccess }: { client: Client | null; onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(client?.name || "");
    const [email, setEmail] = useState(client?.email || "");
    const [company, setCompany] = useState(client?.company || "");
    const [phone, setPhone] = useState(client?.phone || "");
    const [address, setAddress] = useState(client?.address || "");
    const [currency, setCurrency] = useState(client?.currency || "INR");
    const [notes, setNotes] = useState(client?.notes || "");

    const handleSubmit = async () => {
        if (!name || !email) return toast.error("Name and email are required");
        setLoading(true);
        try {
            const url = client ? `/api/clients/${client.id}` : "/api/clients";
            const res = await fetch(url, {
                method: client ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, company: company || null, phone: phone || null, address: address || null, currency, notes: notes || null }),
            });
            if (res.ok) {
                toast.success(client ? "Client updated!" : "Client added! 🎉");
                onSuccess();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed");
            }
        } catch {
            toast.error("Failed to save client");
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { label: "Name *", value: name, setter: setName, placeholder: "John Doe", type: "text" },
        { label: "Email *", value: email, setter: setEmail, placeholder: "john@company.com", type: "email" },
        { label: "Company", value: company, setter: setCompany, placeholder: "Acme Inc.", type: "text" },
        { label: "Phone", value: phone, setter: setPhone, placeholder: "+91 98765 43210", type: "text" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-display font-bold text-text-primary">{client ? "Edit Client" : "New Client"}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover text-text-muted"><span className="text-lg">×</span></button>
                </div>
                <div className="p-6 space-y-4">
                    {fields.map((f) => (
                        <div key={f.label}>
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">{f.label}</label>
                            <input
                                type={f.type}
                                value={f.value}
                                onChange={(e) => f.setter(e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Currency</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30">
                            {CURRENCY_LIST.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Address</label>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none h-20" placeholder="123 Main St, City" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2.5 bg-bg-base border border-border rounded-xl text-sm font-medium text-text-primary placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none h-16" placeholder="Internal notes about this client..." />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-bg-hover/30 rounded-b-2xl">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} loading={loading}>{client ? "Update" : "Add Client"}</Button>
                </div>
            </div>
        </div>
    );
}
