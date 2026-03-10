import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { categoryIcons } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Share2, Download, CheckCircle2, AlertTriangle, XCircle, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { AuditTimeline } from "@/components/AuditTimeline";

const CredentialDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [cred, setCred] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchCred = async () => {
      try {
        const token = localStorage.getItem("deid_token");
        if (!token || !id) return;

        let fetched = false;
        try {
          const res = await api.credentials.getById(id, token);
          if (res.success) {
            const c = res.data;
            setCred({
              id: c._id,
              credentialHash: c.credentialHash,
              title: c.title,
              issuer: c.issuerId?.organizationName || c.issuerId?.name || "Verified Issuer",
              issuerDid: c.issuerId?.did || "Unknown DID",
              category: "other", // Default fallback if no category
              status: c.revoked ? "revoked" : "verified",
              description: c.description,
              issueDate: new Date(c.issuedAt || c.createdAt || new Date()).toLocaleDateString(),
              expiryDate: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : null,
              ipfsCid: c.ipfsCID,
              txHash: c.blockchainTxHash,
              metadata: {},
              isGov: false
            });
          }
        } catch (e) { }

        // Fallback / secondary fetch for Government Certificates
        try {
          const res = await api.certificates.getById(id, token);
          if (res.success && res.data) {
            const c = res.data;
            setCred({
              id: c.docHash,
              credentialHash: c.docHash,
              title: c.title,
              issuer: "Government Agency",
              issuerDid: c.createdByWallet || "Unknown DID",
              category: "certification",
              status: c.state === 'REVOKED' ? "revoked" : "verified",
              description: c.description,
              issueDate: new Date(c.createdAt || new Date()).toLocaleDateString(),
              expiryDate: null,
              ipfsCid: c.ipfsCID,
              txHash: "Requires Smart Contract Check",
              metadata: {
                RequiredApprovals: c.requiredApprovals,
                CurrentApprovals: c.approvers.length
              },
              isGov: true,
              timestamps: c.stateTimestamps,
              currentState: c.state
            });
          }
        } catch (e) { }
      } catch (err) {
        console.error("Failed to fetch credential", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCred();
  }, [id]);

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this credential? This action is irreversible on the blockchain.")) return;
    try {
      const token = localStorage.getItem("deid_token");
      if (!token) return;
      const res = await api.credentials.revoke(cred.id, token);
      if (res.success) {
        toast.success("Credential revoked successfully on the blockchain");
        setCred({ ...cred, status: "revoked" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke credential");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!cred) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Credential not found.</p>
          <Link to="/credentials"><Button variant="ghost" className="mt-4">Back to wallet</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  // Use standard window location origin for seamless live hosting
  const shareUrl = `${window.location.origin}/verify?id=${cred.credentialHash}`;
  const statusConfig = {
    verified: { icon: CheckCircle2, label: "Verified Authentic", className: "bg-success/10 text-success border-success/20" },
    pending: { icon: AlertTriangle, label: "Pending Verification", className: "bg-warning/10 text-warning border-warning/20" },
    revoked: { icon: XCircle, label: "Revoked", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const st = statusConfig[cred.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/credentials" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to wallet
        </Link>

        {/* Header */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-3xl mb-2 block">{categoryIcons[cred.category as keyof typeof categoryIcons] || categoryIcons.other}</span>
              <h1 className="font-display text-2xl font-bold">{cred.title}</h1>
              <p className="text-muted-foreground mt-1">Issued by {cred.issuer}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${st.className}`}>
              <st.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{st.label}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{cred.description}</p>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm">Credential Details</h3>
            {[
              ["Category", cred.category],
              ["Issue Date", cred.issueDate],
              ["Expiry Date", cred.expiryDate || "No expiration"],
              ["Issuer DID", cred.issuerDid],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-mono break-all">{value}</p>
              </div>
            ))}
            {Object.entries(cred.metadata).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-sm">{String(v)}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm">Blockchain Record</h3>
            <div>
              <p className="text-xs text-muted-foreground">IPFS CID</p>
              <p className="text-sm font-mono break-all">{cred.ipfsCid}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transaction Hash</p>
              <p className="text-sm font-mono break-all">{cred.txHash || "Not yet recorded"}</p>
            </div>
            {cred.txHash && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary gap-2 p-0 h-auto"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${cred.txHash}`, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" /> View on Explorer
              </Button>
            )}
          </div>
        </div>

        {cred.isGov && cred.timestamps && (
          <div className="glass-card p-6 mt-4">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">🏛️ Government Lifecycle Audit Trail</h3>
            {/* dynamic import to avoid hoisting issues or use direct import in the file header */}
            <div className="mt-4">
              <AuditTimeline timestamps={cred.timestamps} currentState={cred.currentState} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-border">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Share Credential</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-foreground rounded-xl">
                  <QRCodeSVG value={shareUrl} size={200} />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <code className="flex-1 min-w-0 text-xs bg-secondary/50 p-3 rounded-lg truncate">{shareUrl}</code>
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2 border-border">
            <Download className="h-4 w-4" /> Download Proof
          </Button>

          {user?.role === 'issuer' && cred.status !== 'revoked' && (
            <Button variant="destructive" className="gap-2" onClick={handleRevoke}>
              <XCircle className="h-4 w-4" /> Revoke Credential
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CredentialDetail;
