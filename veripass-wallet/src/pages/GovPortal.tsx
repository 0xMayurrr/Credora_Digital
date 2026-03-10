import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, CheckCircle, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { blockchain } from "@/lib/blockchain";
import { AuditTimeline } from "@/components/AuditTimeline";

export default function GovPortal() {
    const { user } = useAuth();
    const [certs, setCerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Draft Form State
    const [title, setTitle] = useState("");
    const [issuedToWallet, setIssuedToWallet] = useState("");
    const [docFile, setDocFile] = useState<File | null>(null);
    const [approverWallets, setApproverWallets] = useState("");
    const [drafting, setDrafting] = useState(false);

    useEffect(() => {
        fetchCerts();
    }, [user]);

    const fetchCerts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("deid_token");
            if (token) {
                const res = await api.certificates.getAll(token);
                if (res.success) setCerts(res.data);
            }
        } catch {
            toast.error("Failed to fetch certificates");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !issuedToWallet || !docFile || !approverWallets) return toast.error("Please fill all fields");
        setDrafting(true);

        try {
            const token = localStorage.getItem("deid_token");
            if (!token) return;

            const approvers = approverWallets.split(',').map(s => s.trim());

            const formData = new FormData();
            formData.append("title", title);
            formData.append("issuedToWallet", issuedToWallet);
            formData.append("designatedApprovers", JSON.stringify(approvers));
            formData.append("requiredApprovals", String(approvers.length));
            formData.append("document", docFile);

            const res = await api.certificates.create(formData, token);
            if (res.success) {
                toast.success("Certificate Draft Created & Uploaded to IPFS");
                fetchCerts();
                setTitle(""); setIssuedToWallet(""); setDocFile(null); setApproverWallets("");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create draft");
        } finally {
            setDrafting(false);
        }
    };

    const updateState = async (hash: string, newState: string) => {
        try {
            const token = localStorage.getItem("deid_token");
            if (!token) return;

            setLoading(true);
            try {
                if (newState === 'UNDER_REVIEW') {
                    await blockchain.certificateLifecycle.submitForReview(hash);
                } else if (newState === 'APPROVED') {
                    await blockchain.certificateLifecycle.approve(hash);
                } else if (newState === 'SIGNED') {
                    await blockchain.certificateLifecycle.sign(hash);
                } else if (newState === 'ISSUED') {
                    await blockchain.certificateLifecycle.issue(hash);
                } else if (newState === 'REVOKED') {
                    const reason = prompt("Enter revocation reason:") || "Administrative Revocation";
                    await blockchain.certificateLifecycle.revoke(hash, reason);
                }
                toast.success("Blockchain Transaction Confirmed!");
            } catch (err: any) {
                console.error("Blockchain error:", err);
                toast.error("Blockchain transaction failed. Ensure you are connected with the correct MetaMask account.");
                setLoading(false);
                return;
            }

            await api.certificates.updateState(hash, newState, token);
            toast.success(`State updated to ${newState}`);
            fetchCerts();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-primary" /> Government Portal
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage official certificates, proofs, and lifecycle approvals.</p>
                </div>

                {user?.role === 'ISSUER_OFFICER' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-4 font-display">Create Certificate Draft</h2>
                        <form onSubmit={handleCreateDraft} className="space-y-4 max-w-xl">
                            <div>
                                <Label>Certificate Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Master of Science Degree" />
                            </div>
                            <div>
                                <Label>Citizen Wallet Address (issued to)</Label>
                                <Input value={issuedToWallet} onChange={e => setIssuedToWallet(e.target.value)} placeholder="0x..." />
                            </div>
                            <div>
                                <Label>Designated Approvers (comma-separated wallets)</Label>
                                <Input value={approverWallets} onChange={e => setApproverWallets(e.target.value)} placeholder="0xAdmin1, 0xAdmin2" />
                            </div>
                            <div>
                                <Label>Original Document (PDF/Image)</Label>
                                <Input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                            </div>
                            <Button type="submit" disabled={drafting} className="w-full gap-2">
                                {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Create Draft
                            </Button>
                        </form>
                    </div>
                )}

                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-display">Active Lifecycle Certificates</h2>

                    {certs.length === 0 ? (
                        <div className="text-center p-10 glass-card">No certificates found for your role.</div>
                    ) : (
                        certs.map(cert => (
                            <div key={cert.docHash} className="glass-card p-6 flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{cert.title}</h3>
                                            <p className="font-mono text-xs text-muted-foreground mt-1 break-all bg-secondary/30 p-1.5 rounded">Hash: {cert.docHash}</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                                            {cert.state}
                                        </div>
                                    </div>

                                    <div className="text-sm bg-secondary/20 p-4 rounded-lg space-y-2 font-mono">
                                        <p><span className="text-muted-foreground">Issued To:</span> {cert.issuedToWallet}</p>
                                        <p><span className="text-muted-foreground">Approvals:</span> {cert.approvers.length} / {cert.requiredApprovals}</p>
                                    </div>

                                    {/* Actions based on role and state */}
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        {user?.role === 'ISSUER_OFFICER' && cert.state === 'DRAFT' && (
                                            <Button onClick={() => updateState(cert.docHash, 'UNDER_REVIEW')}>Submit for Review</Button>
                                        )}
                                        {user?.role === 'APPROVER' && cert.state === 'UNDER_REVIEW' && (
                                            <Button onClick={() => updateState(cert.docHash, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-700">Approve Document</Button>
                                        )}
                                        {user?.role === 'APPROVER' && cert.state === 'APPROVED' && (
                                            <Button onClick={() => updateState(cert.docHash, 'SIGNED')} className="bg-blue-600 hover:bg-blue-700">Sign Document</Button>
                                        )}
                                        {user?.role === 'ISSUER_OFFICER' && cert.state === 'SIGNED' && (
                                            <Button onClick={() => updateState(cert.docHash, 'ISSUED')} className="bg-primary text-primary-foreground">Final Issue</Button>
                                        )}
                                        {user?.role === 'ADMIN' && cert.state !== 'REVOKED' && (
                                            <Button variant="destructive" onClick={() => updateState(cert.docHash, 'REVOKED')}><XCircle className="w-4 h-4 mr-2" /> Revoke Internally</Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 w-full bg-secondary/10 p-4 rounded-xl border border-border/50">
                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Audit Trail</h4>
                                    <AuditTimeline timestamps={cert.stateTimestamps} currentState={cert.state} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
