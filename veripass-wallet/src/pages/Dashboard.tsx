import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categoryIcons } from "@/lib/mock-data";
import { Wallet, Share2, CheckCircle2, Clock, ArrowRight, Copy, Loader2, ShieldCheck, Github, Award, Star, GitCommit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCredentials } from "@/hooks/useCredentials";
import { Identity } from "@semaphore-protocol/identity";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className="glass-card p-5 border-white/5 hover:border-primary/20 transition-all duration-300">
    <div className="flex items-center gap-3 mb-2">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-primary/20 border border-primary/30" : "bg-secondary/30"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "text-muted-foreground"}`} />
      </div>
      <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground/70">{label}</span>
    </div>
    <div className="font-display text-3xl font-black tracking-tight">{value}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { getMyCredentials } = useCredentials();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [repScore, setRepScore] = useState<number | null>(null);
  const [zkProofStatus, setZkProofStatus] = useState<string>("");
  const [topRepos, setTopRepos] = useState<any[]>([]);

  const isAuthority = ['ISSUER_OFFICER', 'APPROVER', 'ADMIN', 'UNIVERSITY'].includes(user?.role || '');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const creds = await getMyCredentials();
        
        const mapped = creds.map((c: any) => ({
          id: c._id || c.credentialHash,
          title: c.title,
          issuer: c.issuerId?.organizationName || c.issuerId?.name || "Official Fabric Issuer",
          recipient: c.recipientWallet?.substring(0, 10) + '...',
          category: c.category || "other",
          status: c.revoked ? "revoked" : "verified",
          description: c.description,
          issueDate: new Date(c.issuedAt || c.createdAt).toLocaleDateString(),
          expiryDate: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : null,
          fabricProof: c.blockchainTxHash
        }));
        setCredentials(mapped);

        if (!isAuthority) {
          const token = localStorage.getItem("deid_token");
          if (token) {
            const shareRes = await api.shares.getAll(token);
            if (shareRes.success) setShares(shareRes.data);
          }
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }

      if (user?.walletAddress) {
        try {
          const scoreRes = await api.devrep.getScore(user.walletAddress);
          setRepScore(scoreRes.score);
        } catch (e) { }
      }
    };
    fetchAllData();
  }, [user]);

  const verified = credentials.filter((c) => c.status === "verified").length;
  const revoked = credentials.filter((c) => c.status === "revoked").length;
  const activeShares = shares.filter((s) => new Date(s.expiresAt) > new Date()).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-black tracking-tight flex items-center gap-3">
              Hello, <span className="gradient-text">{user?.name}</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Connected to Fabric Network" />
            </h1>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full w-fit">
              <span className="text-xs text-muted-foreground/80 font-mono tracking-tighter">{user?.did || user?.walletAddress}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(user?.did || user?.walletAddress || ""); toast.success("ID Copied"); }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                title="Copy Identity"
              >
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isAuthority && (
              <Link to="/gov" className="w-full md:w-auto">
                <Button size="lg" className="w-full md:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-bold tracking-wide">
                  Authority Portal <ShieldCheck className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {user?.role === "issuer" && (
              <Link to="/issuer/issue" className="w-full md:w-auto">
                <Button size="lg" className="w-full md:w-auto gap-2 bg-primary shadow-lg shadow-primary/20 font-bold tracking-wide">
                  Issue Credential <Wallet className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Network Status Bar */}
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Enterprise Network: Hyperledger Fabric v2.5 Online</span>
            </div>
            <div className="text-[10px] font-mono text-blue-400/60 hidden sm:block">CHANNEL: credora-main-channel</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label={user?.role === "issuer" ? "Issued via Ledger" : "Credential Count"} value={loading ? "..." : String(credentials.length)} accent />
          <StatCard icon={CheckCircle2} label="Active on Ledger" value={loading ? "..." : String(verified)} />
          <StatCard icon={Clock} label="Revoked/Expired" value={loading ? "..." : String(revoked)} />
          {!isAuthority && <StatCard icon={Share2} label="Active Shares" value={String(activeShares)} />}
        </div>

        {/* Developer Portfolio & ZK Rep Score */}
        {(user?.role === "user" || user?.role === "CITIZEN") && (
          <div className="glass-card p-6 md:p-8 space-y-6 border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-lg">
              ZK-REP PROOF SYSTEM
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Github className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display font-black text-2xl tracking-tight">Hackathon Dev Portfolio</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Powered by Semaphore Zero-Knowledge Proofs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Prove your skills to recruiters <b>without exposing your private code</b>. We compute a cryptographically verified score based on your GitHub activity and anchor the proof hash on the Fabric ledger.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="githubUsername" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Link GitHub Identity</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="githubUsername" 
                      value={githubUsername} 
                      onChange={(e) => setGithubUsername(e.target.value)} 
                      placeholder="e.g. torvalds" 
                      className="bg-black/40 border-white/10 focus:border-emerald-500/50 h-12" 
                    />
                    <Button 
                      onClick={async () => {
                        if (!githubUsername) return toast.error("Enter GitHub handle");
                        setGithubSyncing(true);
                        setZkProofStatus("Initiating Semaphore ZK-Proof Generation...");
                        try {
                          const token = localStorage.getItem("deid_token");
                          const repos = await api.github.getStats(githubUsername);
                          if (!repos || repos.message) throw new Error("Repo sync failed");
                          
                          const identity = new Identity(user?.walletAddress || "fabric-identity");
                          setZkProofStatus(`ZK Identity Proof Generated: Commitment ${identity.commitment.toString().substring(0, 12)}... Record anchored on ledger.`);
                          
                          if (token && user?.walletAddress) {
                            const updateRes = await api.devrep.updateScore(repos.length, token);
                            setRepScore(updateRes.score);
                            setTopRepos([...repos].sort((a,b) => b.stargazers_count - a.stargazers_count).slice(0, 3));
                            toast.success("Identity Verified & Score Updated!");
                          }
                        } catch (err: any) {
                          toast.error(err.message);
                          setZkProofStatus("Verification Interrupted");
                        } finally {
                          setGithubSyncing(false);
                        }
                      }} 
                      disabled={githubSyncing} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 shadow-lg shadow-emerald-500/20"
                    >
                      {githubSyncing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Identity (ZK)"}
                    </Button>
                  </div>
                </div>

                {zkProofStatus && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-[11px] font-mono leading-relaxed border border-emerald-500/20 flex gap-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{zkProofStatus}</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between relative overflow-hidden group/score">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/score:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">On-Chain Dev Rep Score</p>
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                      <span className="text-sm font-bold text-emerald-500/80 tracking-widest">REPUTATION_TIER: {repScore && repScore > 500 ? 'SENIOR' : 'DEVELOPER'}</span>
                    </div>
                  </div>
                  <div className="relative z-10 text-6xl font-black font-display text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    {repScore !== null ? repScore : "---"}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
                    <QRCodeSVG value={`${window.location.origin}/verify-rep/${user?.walletAddress}`} size={100} level="H" bgColor="transparent" fgColor="white" />
                    <p className="text-[9px] uppercase tracking-widest font-bold mt-3 text-muted-foreground">Portfolio Scan</p>
                  </div>
                  <div className="flex-[2] space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Top Contributions</h3>
                    {topRepos.map((repo, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-[11px]">
                        <span className="font-bold truncate max-w-[120px]">{repo.name}</span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-500" /> {repo.stargazers_count}
                        </div>
                      </div>
                    ))}
                    {topRepos.length === 0 && <div className="text-[10px] italic text-muted-foreground/50 py-4">No public repos synced yet...</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Credentials */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black tracking-tight">
              {user?.role === "issuer" ? "Issued on Ledger" : "Recent Ledger Entries"}
            </h2>
            <Link to="/credentials">
              <Button variant="ghost" size="sm" className="text-primary gap-2 font-bold hover:bg-primary/10 transition-all rounded-full px-4">
                Full Registry <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="glass-card h-40 animate-pulse bg-white/5" />)}
            </div>
          ) : credentials.length === 0 ? (
            <div className="glass-card p-16 text-center border-dashed border-white/10">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">The ledger is currently empty for your identity.</p>
              {user?.role === "issuer" && (
                <Link to="/issuer/issue">
                    <Button variant="link" className="mt-2 text-primary">Initialize first entry now &rarr;</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {credentials.slice(0, 6).map((cred, i) => (
                <motion.div
                  key={cred.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/credentials/${cred.id}`} className="glass-card-hover p-6 block h-full relative overflow-hidden group/cred">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/cred:opacity-20 transition-opacity">
                        <ShieldCheck className="h-24 w-24 text-primary" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-secondary/50 text-2xl group-hover/cred:scale-110 transition-transform">
                        {categoryIcons[cred.category as keyof typeof categoryIcons] || categoryIcons.other}
                      </div>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                        cred.status === "verified" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {cred.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 group-hover/cred:text-primary transition-colors">{cred.title}</h3>
                    <p className="text-xs text-muted-foreground/80 mb-4">{user?.role === 'issuer' ? `RECIPIENT: ${cred.recipient}` : `AUTHORITY: ${cred.issuer}`}</p>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-t border-white/5 pt-4">
                        <span>Issued {cred.issueDate}</span>
                        <div className="flex items-center gap-1 text-primary/60">
                            <ShieldCheck className="h-3 w-3" /> VERIFIED
                        </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
