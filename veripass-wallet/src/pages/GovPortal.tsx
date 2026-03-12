import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, CheckCircle, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AuditTimeline } from "@/components/AuditTimeline";
import { useCertificateLifecycle } from "@/hooks/useCertificateLifecycle";

export default function GovPortal() {
    const { user } = useAuth();
    const { createDraft, submitForReview, approveCertificate, signCertificate, issueCertificate, revokeCertificate } = useCertificateLifecycle();
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
            const approvers = approverWallets.split(',').map(s => s.trim());
            const data = await createDraft(issuedToWallet, title, approvers, docFile);

            toast.success("Certificate Draft Created on Fabric Ledger");
            if (data.fraudAnalysis) {
              toast.info(`AI Fraud Score: ${data.fraudAnalysis.riskScore}/100 - ${data.fraudAnalysis.recommendation}`);
            }
            fetchCerts();
            setTitle(""); setIssuedToWallet(""); setDocFile(null); setApproverWallets("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create draft");
        } finally {
            setDrafting(false);
        }
    };

    const handleUpdateState = async (hash: string, newState: string) => {
        try {
            setLoading(true);
            let res;
            if (newState === 'UNDER_REVIEW') res = await submitForReview(hash);
            else if (newState === 'APPROVED') res = await approveCertificate(hash);
            else if (newState === 'SIGNED') res = await signCertificate(hash);
            else if (newState === 'ISSUED') res = await issueCertificate(hash);
            else if (newState === 'REVOKED') res = await revokeCertificate(hash);

            toast.success(`Fabric Transaction Successful: State updated to ${newState}`);
            fetchCerts();
        } catch (err: any) {
            toast.error(err.message || "State update failed");
        } finally {
            setLoading(false);
        }
    };

    const isAuthorizedIssuer = user?.role === 'ISSUER_OFFICER' || user?.role === 'UNIVERSITY';

    if (loading && certs.length === 0) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="font-display text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            <ShieldCheck className="h-10 w-10 text-primary" /> Authority Portal
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">Official Lifecycle Management on Hyperledger Fabric.</p>
                    </div>
                </div>

                {isAuthorizedIssuer && (
                    <div className="glass-card p-8 border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary/20 text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-bold font-display">Issue New Official Document</h2>
                        </div>
                        <form onSubmit={handleCreateDraft} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold mb-1.5 block">Certificate Title / Document Name</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Master of Science Degree" className="bg-background/50 border-white/10" />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold mb-1.5 block">Citizen Wallet Address (issued to)</Label>
                                    <Input value={issuedToWallet} onChange={e => setIssuedToWallet(e.target.value)} placeholder="0x..." className="bg-background/50 border-white/10 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold mb-1.5 block">Designated Approvers (IDs/Wallets)</Label>
                                    <Input value={approverWallets} onChange={e => setApproverWallets(e.target.value)} placeholder="0xAdmin1, 0xAdmin2" className="bg-background/50 border-white/10" />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold mb-1.5 block">Original Document (PDF/Image)</Label>
                                    <Input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} className="bg-background/50 border-white/10 cursor-pointer" />
                                </div>
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" disabled={drafting} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all gap-3">
                                    {drafting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Record Draft on Fabric Ledger
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold font-display flex items-center gap-3">
                            Active Documents <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">{certs.length}</span>
                        </h2>
                        <Button variant="ghost" size="sm" onClick={fetchCerts} className="text-xs">Refresh Ledger</Button>
                    </div>

                    {certs.length === 0 ? (
                        <div className="text-center p-16 glass-card border-dashed border-white/10 opacity-60">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-xl font-medium">No certificates found on the ledger.</p>
                        </div>
                    ) : (
                        certs.map(cert => (
                            <div key={cert.docHash} className="glass-card overflow-hidden border-white/5 hover:border-primary/30 transition-all duration-300">
                                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-stretch">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                  <h3 className="font-bold text-2xl font-display">{cert.title}</h3>
                                                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    cert.state === 'ISSUED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    cert.state === 'REVOKED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                  }`}>
                                                      {cert.state}
                                                  </div>
                                                </div>
                                                <p className="font-mono text-[10px] text-muted-foreground/60 break-all bg-black/40 px-2 py-1 rounded-md border border-white/5">
                                                  LEDGER_HASH: {cert.docHash}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                              <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Subject Address</p>
                                              <p className="font-mono text-sm truncate">{cert.issuedToWallet}</p>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                              <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Approval Status</p>
                                              <p className="text-sm font-bold flex items-center gap-2">
                                                {cert.approvers.length} / {cert.requiredApprovals} Verified
                                                {cert.approvers.length >= cert.requiredApprovals && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                              </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3 pt-4">
                                            {isAuthorizedIssuer && cert.state === 'DRAFT' && (
                                                <Button size="lg" onClick={() => handleUpdateState(cert.docHash, 'UNDER_REVIEW')} className="bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">Submit for Multi-Org Review</Button>
                                            )}
                                            {user?.role === 'APPROVER' && cert.state === 'UNDER_REVIEW' && (
                                                <Button size="lg" onClick={() => handleUpdateState(cert.docHash, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 flex items-center gap-2">
                                                  <CheckCircle className="w-4 h-4" /> Endorse Document
                                                </Button>
                                            )}
                                            {user?.role === 'APPROVER' && cert.state === 'APPROVED' && (
                                                <Button size="lg" onClick={() => handleUpdateState(cert.docHash, 'SIGNED')} className="bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 flex items-center gap-2">
                                                  <ShieldCheck className="w-4 h-4" /> Sign with MSP Identity
                                                </Button>
                                            )}
                                            {isAuthorizedIssuer && cert.state === 'SIGNED' && (
                                                <Button size="lg" onClick={() => handleUpdateState(cert.docHash, 'ISSUED')} className="bg-primary text-primary-foreground shadow-primary/30 font-bold uppercase tracking-widest">Final Ledger Issuance</Button>
                                            )}
                                            {user?.role === 'ADMIN' && cert.state !== 'REVOKED' && (
                                                <Button variant="destructive" size="lg" onClick={() => handleUpdateState(cert.docHash, 'REVOKED')} className="gap-2">
                                                  <XCircle className="w-4 h-4" /> Revoke on Chain
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:w-[350px] bg-secondary/5 p-6 rounded-2xl border border-white/5 flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-primary" /> Fabric Audit Trail
                                          </h4>
                                          {cert.stateTimestamps?.[0]?.metadata?.fraudRisk !== undefined && (
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${cert.stateTimestamps[0].metadata.fraudRisk > 40 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                              <AlertTriangle className="w-3 h-3" />
                                              Risk: {cert.stateTimestamps[0].metadata.fraudRisk}%
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                                          <AuditTimeline timestamps={cert.stateTimestamps} currentState={cert.state} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
