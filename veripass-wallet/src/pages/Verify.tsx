import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryIcons } from "@/lib/mock-data";
import { Search, CheckCircle2, AlertTriangle, XCircle, Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { AuditTimeline } from "@/components/AuditTimeline";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const initialToken = searchParams.get("token") || "";
  const [credentialId, setCredentialId] = useState(initialId || initialToken);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleVerify(initialId, false);
    } else if (initialToken) {
      handleVerify(initialToken, true);
    }
  }, [initialId, initialToken]);

  const handleVerify = async (idToVerify: string = credentialId, isToken: boolean = false) => {
    if (!idToVerify.trim()) return;
    setVerifying(true);
    setNotFound(false);
    setResult(null);
    try {
      let res;
      if (isToken || idToVerify.length < 40) { // arbitrary heuristic for token vs hash
        res = await api.shares.access(idToVerify.trim());
        if (res.success) {
          const c = res.data.credential;
          setResult({
            id: idToVerify.trim(),
            status: c.revoked ? "revoked" : "valid",
            title: c.title || "Verifiable Credential",
            issuer: c.issuerId?.name || "Verified Issuer",
            recipient: c.recipientWallet?.substring(0, 10) + '...' || "Unknown",
            description: c.description || "",
            issueDate: new Date(c.issuedAt || Date.now()).toLocaleDateString(),
            expiryDate: res.data.expiresAt ? new Date(res.data.expiresAt).toLocaleDateString() : null,
            ipfsCid: c.ipfsCID || "",
            txHash: c.blockchainTxHash || "Verifiable on-chain",
            category: c.category || "other",
          });
          return;
        }
      }

      res = await api.verify.verifyCredentialObj(idToVerify.trim());
      if (res.success) {
        setResult({
          id: idToVerify.trim(),
          status: res.authenticity.toLowerCase(),
          title: res.metadata?.title || "Verifiable Credential",
          issuer: res.metadata?.issuerConfig?.organizationName || res.metadata?.issuerConfig?.name || res.blockchainData?.issuer || "Unknown",
          recipient: res.metadata?.recipientConfig?.name || res.blockchainData?.recipient || "Unknown",
          description: res.metadata?.description || "",
          issueDate: new Date(res.blockchainData?.issuedAt || Date.now()).toLocaleDateString(),
          expiryDate: res.metadata?.expiryDate ? new Date(res.metadata.expiryDate).toLocaleDateString() : null,
          ipfsCid: res.blockchainData?.ipfsCID || "",
          txHash: "Verifiable on-chain",
          category: "other",
          isGov: false
        });
        return;
      }
    } catch (err) { }

    try {
      const govRes = await api.certificates.verify(idToVerify.trim());
      if (govRes.success) {
        const c = govRes.data;
        setResult({
          id: c.docHash,
          status: c.state === 'REVOKED' ? "revoked" : c.state === 'ISSUED' ? "valid" : "pending",
          title: c.title,
          issuer: "Government Agency",
          recipient: c.issuedToWallet?.substring(0, 10) + '...',
          description: c.description,
          issueDate: new Date(c.createdAt || Date.now()).toLocaleDateString(),
          expiryDate: null,
          ipfsCid: c.ipfsCID,
          txHash: "Requires Smart Contract Check",
          category: "certification",
          isGov: true,
          timestamps: c.stateTimestamps,
          currentState: c.state
        });
        return;
      }
    } catch (err) { }

    setNotFound(true);
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-6">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Verify a Credential</h1>
          <p className="text-muted-foreground">Enter a credential hash, share token, scan a QR code, or open a shared link to verify authenticity.</p>
        </motion.div>

        <div className="glass-card p-6 mb-8">
          <div className="flex gap-3">
            <Input
              placeholder="Enter credential hash or share token"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="bg-secondary/50 border-border"
            />
            <Button onClick={() => handleVerify()} disabled={verifying} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {verifying && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-10 text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying credential on-chain...</p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>Fetching metadata...</p>
                <p>Comparing with blockchain record...</p>
              </div>
            </motion.div>
          )}

          {result && !verifying && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-8">
              {/* Status Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${result.status === "valid" ? "bg-success/10 border border-success/20" :
                result.status === "revoked" ? "bg-destructive/10 border border-destructive/20" :
                  "bg-warning/10 border border-warning/20"
                }`}>
                {result.status === "valid" ? <CheckCircle2 className="h-6 w-6 text-success" /> :
                  result.status === "revoked" ? <XCircle className="h-6 w-6 text-destructive" /> :
                    <AlertTriangle className="h-6 w-6 text-warning" />}
                <div>
                  <p className={`font-display font-bold ${result.status === "valid" ? "text-success" :
                    result.status === "revoked" ? "text-destructive" : "text-warning"
                    }`}>
                    {result.status === "valid" ? "✅ Verified Authentic" :
                      result.status === "revoked" ? "❌ Revoked" : "⚠️ Pending/Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.status === "valid" ? "This credential has been cryptographically verified on the blockchain." :
                      result.status === "revoked" ? "This credential has been revoked by the issuer." :
                        "This credential status is unknown or pending."}
                  </p>
                </div>
              </div>

              {result.isGov && result.timestamps && (
                <div className="mt-6 border-t border-border/50 pt-6">
                  <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">🏛️ Government Lifecycle Audit Trail</h3>
                  <AuditTimeline timestamps={result.timestamps} currentState={result.currentState} />
                </div>
              )}

              {/* Credential info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[result.category as keyof typeof categoryIcons] || categoryIcons.other}</span>
                  <div>
                    <h2 className="font-display text-xl font-bold">{result.title}</h2>
                    <p className="text-sm text-muted-foreground">Issued to <span className="font-medium text-foreground">{result.recipient}</span> by {result.issuer}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{result.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div><p className="text-xs text-muted-foreground">Issue Date</p><p className="text-sm">{result.issueDate}</p></div>
                  <div><p className="text-xs text-muted-foreground">Expiry</p><p className="text-sm">{result.expiryDate || "None"}</p></div>
                  <div><p className="text-xs text-muted-foreground">IPFS CID</p><p className="text-xs font-mono break-all">{result.ipfsCid}</p></div>
                  <div><p className="text-xs text-muted-foreground">TX Hash</p><p className="text-xs font-mono break-all">{result.txHash}</p></div>
                </div>
              </div>

              {/* Call to Action for Visitors */}
              <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">Want to own and share your own verifiable credentials?</p>
                <Link to="/signup">
                  <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Your Credora Wallet
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {notFound && !verifying && (
            <motion.div key="notfound" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-8 text-center">
              <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Credential Not Found</h3>
              <p className="text-sm text-muted-foreground">No valid credential exists with this hash. It may have been revoked or not fully confirmed on-chain yet.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Verify;
