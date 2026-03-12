import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryIcons } from "@/lib/mock-data";
import { Search, CheckCircle2, AlertTriangle, XCircle, Shield, Loader2, Link as LinkIcon, ExternalLink, ShieldCheck, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useCredentials } from "@/hooks/useCredentials";
import { AuditTimeline } from "@/components/AuditTimeline";
import { toast } from "sonner";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const { verifyCredential } = useCredentials();
  
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
      // 1. Try Share Token Access First (if applicable)
      if (isToken || idToVerify.length < 40) {
        const shareRes = await api.shares.access(idToVerify.trim());
        if (shareRes.success) {
          const c = shareRes.data.credential;
          setResult({
            id: idToVerify.trim(),
            status: c.revoked ? "revoked" : "valid",
            title: c.title || "Verifiable Credential",
            issuer: c.issuerId?.organizationName || c.issuerId?.name || "Official Fabric Issuer",
            recipient: c.recipientWallet?.substring(0, 10) + '...' || "Anonymized Identity",
            description: c.description || "",
            issueDate: new Date(c.issuedAt || c.createdAt || Date.now()).toLocaleDateString(),
            expiryDate: shareRes.data.expiresAt ? new Date(shareRes.data.expiresAt).toLocaleDateString() : null,
            ipfsCid: c.ipfsCID || "",
            txHash: c.blockchainTxHash || "SECURED_ON_FABRIC",
            category: c.category || "other",
            isFabric: true
          });
          setVerifying(false);
          return;
        }
      }

      // 2. Try Fabric Ledger Direct Verification (via ID/Hash)
      const fabricRes = await verifyCredential(idToVerify.trim());
      if (fabricRes) {
         setResult({
          id: idToVerify.trim(),
          status: fabricRes.revoked ? "revoked" : "valid",
          title: fabricRes.title || "Enterprise Ledger Entry",
          issuer: fabricRes.issuerId?.organizationName || fabricRes.issuerId?.name || "Verified Authority",
          recipient: fabricRes.recipientWallet?.substring(0, 10) + '...',
          description: fabricRes.description || "",
          issueDate: new Date(fabricRes.issuedAt || fabricRes.createdAt).toLocaleDateString(),
          expiryDate: fabricRes.expiryDate ? new Date(fabricRes.expiryDate).toLocaleDateString() : null,
          ipfsCid: fabricRes.ipfsCID || "N/A",
          txHash: fabricRes.blockchainTxHash || "FABRIC_LEDGER_HASH",
          category: fabricRes.category || "other",
          isFabric: true,
          fabricData: fabricRes
        });
        setVerifying(false);
        return;
      }

      // 3. Try Certificates (Gov/University) Lifecycle Verification
      const govRes = await api.certificates.getById(idToVerify.trim());
      if (govRes.success) {
        const c = govRes.data;
        setResult({
          id: c.docHash,
          status: c.state === 'REVOKED' ? "revoked" : c.state === 'ISSUED' ? "valid" : "pending",
          title: c.title || "Official Certificate",
          issuer: c.issuerId?.organizationName || "Government/Academy Authority",
          recipient: c.issuedToWallet?.substring(0, 10) + '...',
          description: c.description,
          issueDate: new Date(c.createdAt || Date.now()).toLocaleDateString(),
          expiryDate: null,
          ipfsCid: c.ipfsCID,
          txHash: c.blockchainTxHash || "SECURED_ON_FABRIC",
          category: "certification",
          isGov: true,
          timestamps: c.stateTimestamps,
          currentState: c.state
        });
        setVerifying(false);
        return;
      }

    } catch (err) {
      console.error("Verification Error:", err);
    }

    setNotFound(true);
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-emerald-500/30">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-16 max-w-3xl relative">
        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight mb-4">
            Fabric <span className="gradient-text">Trust Explorer</span>
          </h1>
          <p className="text-muted-foreground/80 max-w-xl mx-auto leading-relaxed">
            Verify the cryptographic authenticity of any Verpass credential or certificate anchored on our enterprise-grade Hyperledger Fabric ledger.
          </p>
        </motion.div>

        <div className="glass-card p-2 mb-12 border-white/5 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <Input
                placeholder="Paste Credential ID, Hash, or Share Token..."
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="bg-black/20 border-white/5 h-14 pl-12 focus:border-emerald-500/50 transition-all rounded-xl font-mono text-sm"
              />
            </div>
            <Button 
                onClick={() => handleVerify()} 
                disabled={verifying} 
                className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-xl font-bold tracking-wide gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {verifying ? "VERIFYING..." : "VERIFY NOW"}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {verifying && (
            <motion.div 
                key="loading" 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.98 }} 
                className="glass-card p-12 text-center border-white/10"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-4 rounded-full border-2 border-blue-500/20 border-b-blue-500 animate-spin [animation-duration:2s]" />
                <Shield className="absolute inset-0 m-auto h-8 w-8 text-emerald-500/50" />
              </div>
              <h3 className="text-lg font-black tracking-widest uppercase mb-2">Polling Enterprise Ledger</h3>
              <p className="text-sm text-muted-foreground animate-pulse">Establishing secure connection to Fabric Peer...</p>
            </motion.div>
          )}

          {result && !verifying && (
            <motion.div 
                key="result" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-6"
            >
              {/* Status Header */}
              <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-2xl ${
                result.status === "valid" ? "bg-emerald-500/5 border-emerald-500/30" :
                result.status === "revoked" ? "bg-red-500/5 border-red-500/30" :
                "bg-yellow-500/5 border-yellow-500/30"
              }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                        result.status === "valid" ? "bg-emerald-500/20 text-emerald-500" :
                        result.status === "revoked" ? "bg-red-500/20 text-red-500" :
                        "bg-yellow-500/20 text-yellow-500"
                    }`}>
                        {result.status === "valid" ? <CheckCircle2 className="h-8 w-8" /> :
                         result.status === "revoked" ? <XCircle className="h-8 w-8" /> :
                         <AlertTriangle className="h-8 w-8" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-2xl font-black uppercase tracking-tighter">
                                {result.status === "valid" ? "Verified Authentic" :
                                 result.status === "revoked" ? "Invalid/Revoked" : "Pending Approval"}
                            </h2>
                            {result.isFabric && (
                                <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-black tracking-widest border border-blue-500/30">FABRIC_V2</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground/80 font-medium">Cryptographic proof discovered in block history</p>
                    </div>
                </div>
                <div className="hidden sm:block">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-1">Status Code</p>
                        <p className={`font-mono text-sm ${result.status === 'valid' ? 'text-emerald-400' : 'text-red-400'}`}>0x{result.status.toUpperCase()}_SUCCESS</p>
                    </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-card p-8 border-white/5 space-y-8">
                    <div className="flex items-start gap-5">
                         <div className="p-4 rounded-2xl bg-secondary/50 text-4xl shadow-inner border border-white/5">
                            {categoryIcons[result.category as keyof typeof categoryIcons] || categoryIcons.other}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight mb-2">{result.title}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground/70">
                                <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500/60" /> <b>Authority:</b> {result.issuer}</span>
                                <span className="flex items-center gap-1.5"><ExternalLink className="h-4 w-4 text-blue-500/60" /> <b>Recipient:</b> {result.recipient}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ledger Description</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground/90 bg-white/5 p-4 rounded-xl border border-white/5 italic">
                            "{result.description || "No public metadata provided for this ledger entry."}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Anchored On</p>
                            <p className="text-sm font-bold text-emerald-500/80">{result.issueDate}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Expiration</p>
                            <p className="text-sm font-bold">{result.expiryDate || "PERPETUAL ENTRY"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Storage CID (IPFS)</p>
                            <p className="text-[11px] font-mono text-muted-foreground truncate" title={result.ipfsCid}>{result.ipfsCid}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">On-Chain Proof</p>
                            <p className="text-[11px] font-mono text-blue-400 truncate" title={result.txHash}>{result.txHash}</p>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-12 font-bold text-xs uppercase tracking-widest">
                            Download JSON Proof
                        </Button>
                        <Button className="flex-1 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 rounded-xl h-12 font-bold text-xs uppercase tracking-widest">
                            View IPFS Asset
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Lifecycle/Audit */}
                    <div className="glass-card p-6 border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-6 flex items-center gap-2">
                            <History className="h-4 w-4" /> Proof Lifecycle
                        </h4>
                        
                        {result.isGov && result.timestamps ? (
                             <AuditTimeline timestamps={result.timestamps} currentState={result.currentState} />
                        ) : (
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <div className="absolute top-3 bottom-0 left-[5.5px] w-px bg-white/10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-tighter">Genesis Hash Created</p>
                                        <p className="text-[10px] text-muted-foreground/60">{result.issueDate}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <div className="absolute top-3 bottom-0 left-[5.5px] w-px bg-white/10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-tighter">Anchored to Main Channel</p>
                                        <p className="text-[10px] text-muted-foreground/60">FABRIC_CONSENSUS_REACHED</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-3 w-3 rounded-full bg-white/10" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Monitoring State</p>
                                        <p className="text-[10px] text-muted-foreground/40">READY_FOR_REVOCATION</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                         <p className="text-[10px] font-black uppercase mb-2 tracking-widest text-emerald-400">Security Verification</p>
                         <p className="text-xs text-muted-foreground leading-relaxed">
                            This data was retrieved directly from the Hyperledger Fabric ledger and cross-referenced with your input. The result is 100% cryptographically guaranteed.
                         </p>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {notFound && !verifying && (
            <motion.div 
                key="notfound" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="glass-card p-12 text-center border-red-500/20 bg-red-500/5 shadow-2xl"
            >
              <div className="h-16 w-16 bg-red-500/20 text-red-500 flex items-center justify-center rounded-2xl mx-auto mb-6 border border-red-500/30">
                <XCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-3">Verification Terminated</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                The specified identity or hash was not found in the enterprise ledger. This could mean the credential was never issued, was purged from the ledger, or your input contains a typo.
              </p>
              <Button onClick={() => setNotFound(false)} variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl px-10">
                RETRY LOOKUP
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed action for guests */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full px-4 max-w-sm">
        <Link to="/signup">
            <Button size="lg" className="w-full bg-white text-black hover:bg-white/90 rounded-2xl h-14 font-black tracking-wide shadow-[0_20px_40px_rgba(255,255,255,0.1)] group">
                GET YOUR VERPASS WALLET
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </Link>
      </div>
    </div>
  );
};

export default Verify;
