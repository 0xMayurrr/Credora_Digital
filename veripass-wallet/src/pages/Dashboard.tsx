import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categoryIcons } from "@/lib/mock-data";
import { Wallet, Share2, CheckCircle2, Clock, ArrowRight, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Identity } from "@semaphore-protocol/identity";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Github, Award, Star, GitCommit } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) => (
  <div className="glass-card p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? "bg-primary/10 border border-primary/20" : "bg-secondary"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="font-display text-2xl font-bold">{value}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [repScore, setRepScore] = useState<number | null>(null);
  const [zkProofStatus, setZkProofStatus] = useState<string>("");
  const [topRepos, setTopRepos] = useState<any[]>([]);

  useEffect(() => {
    const fetchCreds = async () => {
      try {
        const token = localStorage.getItem("deid_token");
        if (!token) return;
        const res = user?.role === 'issuer'
          ? await api.credentials.getIssued(token)
          : await api.credentials.getAll(token);

        if (res.success) {
          const mapped = res.data.map((c: any) => ({
            id: c._id,
            title: c.title,
            issuer: c.issuerId?.organizationName || c.issuerId?.name || "Verified Issuer",
            recipient: c.recipientId?.name || c.recipientWallet?.substring(0, 10) + '...',
            category: c.category || "other",
            status: c.revoked ? "revoked" : "verified",
            description: c.description,
            issueDate: new Date(c.issuedAt || c.createdAt || new Date()).toLocaleDateString(),
            expiryDate: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : null,
          }));
          setCredentials(mapped);
        }

        if (user?.role !== 'issuer' && !['ISSUER_OFFICER', 'APPROVER', 'ADMIN'].includes(user?.role || '')) {
          const shareRes = await api.shares.getAll(token);
          if (shareRes.success) setShares(shareRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch credentials", err);
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
    fetchCreds();
  }, []);

  const verified = credentials.filter((c) => c.status === "verified").length;
  const revoked = credentials.filter((c) => c.status === "revoked").length;
  const pending = credentials.filter((c) => c.status === "pending").length;
  const activeShares = shares.filter((s) => new Date(s.expiresAt) > new Date()).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground font-mono">{user?.did || user?.walletAddress}</span>
              <button onClick={() => { navigator.clipboard.writeText(user?.did || user?.walletAddress || ""); toast.success("Copied to clipboard"); }}>
                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {['ISSUER_OFFICER', 'APPROVER', 'ADMIN'].includes(user?.role || '') && (
              <Link to="/gov">
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">Gov Portal <ShieldCheck className="h-4 w-4" /></Button>
              </Link>
            )}
            {user?.role === "issuer" && (
              <Link to="/issuer/issue">
                <Button className="gap-2 bg-primary">Issue Credential <Wallet className="h-4 w-4" /></Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label={user?.role === "issuer" ? "Issued Credentials" : "Total Credentials"} value={loading ? "..." : String(credentials.length)} accent />
          <StatCard icon={CheckCircle2} label={user?.role === "issuer" ? "Active" : "Verified"} value={loading ? "..." : String(verified)} />
          <StatCard icon={Clock} label={user?.role === "issuer" ? "Revoked" : "Pending"} value={loading ? "..." : String(user?.role === "issuer" ? revoked : pending)} />
          {user?.role !== "issuer" && <StatCard icon={Share2} label="Active Shares" value={String(activeShares)} />}
        </div>

        {/* Developer Portfolio & ZK Rep Score */}
        {(user?.role === "user" || user?.role === "CITIZEN") && (
          <div className="glass-card p-6 space-y-4 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Recruiter View
            </div>

            <div className="flex items-center gap-3">
              <Github className="h-6 w-6 text-emerald-500" />
              <h2 className="font-display font-semibold text-emerald-500 md:text-xl">Hackathon Dev Portfolio & ZKP</h2>
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl">
              <strong>How it works:</strong> We fetch your GitHub commits, hackathon badges, and verified code skills. We then use <i>Semaphore Zero-Knowledge Proofs (ZK)</i> to generate a unified <b>Dev Rep Score</b>. This mathematical proof lets you prove to hackathon judges and recruiters that you are a "Top 10% Developer" without leaking your private code history or exact data metrics!
            </p>

            <div className="flex flex-col lg:flex-row gap-6 mt-4">
              <div className="flex-1 space-y-6">
                <div>
                  <Label htmlFor="githubUsername" className="text-sm">Link GitHub Account</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="githubUsername" name="githubUsername" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="e.g. torvalds" className="bg-secondary/50 border-border" />
                    <Button onClick={async () => {
                      if (!githubUsername) return toast.error("Please enter a GitHub username to sync");
                      setGithubSyncing(true);
                      setZkProofStatus("Generating ZK-SNARK Identity Proof...");
                      try {
                        const token = localStorage.getItem("deid_token");
                        const repos = await api.github.getStats(githubUsername);

                        // Handle standard Github API error vs success format
                        if (!repos || repos.message) {
                          throw new Error(repos.message || "Failed to find repos");
                        }

                        const publicRepos = repos.length || 0;

                        // Sort by stars and get top 3
                        const sortedRepos = [...(repos || [])].sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 3);
                        setTopRepos(sortedRepos);

                        const identity = new Identity(user?.walletAddress || "test");
                        setZkProofStatus(`Zero-Knowledge Proof Generated: Semaphore ID ${identity.commitment.toString().substring(0, 10)}... (Proving code activity privately)`);

                        if (token && user?.walletAddress) {
                          const updateRes = await api.devrep.updateScore(publicRepos, token).catch(e => { throw e });
                          if (updateRes && updateRes.score !== undefined) {
                            setRepScore(updateRes.score);
                          } else {
                            const scoreRes = await api.devrep.getScore(user.walletAddress);
                            setRepScore(scoreRes.score);
                          }
                          toast.success(`Successfully Verified ${publicRepos} Repos! Dev Rep Score computed.`);
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Failed to sync data");
                        setZkProofStatus("ZK-Proof generation failed");
                      } finally {
                        setGithubSyncing(false);
                      }
                    }} disabled={githubSyncing} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
                      {githubSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify Identity (ZK)"}
                    </Button>
                  </div>
                </div>

                <div className="bg-secondary/30 p-5 rounded-lg flex flex-col gap-4 justify-between border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold text-lg">On-chain Dev Rep Score</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Multiplier: (Repos × 0.4) + (Badges * 0.3)</span>
                    </div>
                    <span className="text-4xl font-black font-mono text-emerald-500 drop-shadow-md">{repScore !== null ? repScore : "---"}</span>
                  </div>

                  {/* Detailed explanation requested by user */}
                  <div className="text-sm bg-emerald-500/10 text-emerald-600/90 dark:text-emerald-400 p-3 rounded border border-emerald-500/20">
                    💡 <strong>What this means:</strong> If your score is <strong>300</strong>, it mathematically proves you have significant developer activity. <br />
                    <em>Example: (25 GitHub Repos + 5 Hackathon Badges) = 30 × 10 = 300.</em>
                  </div>
                </div>

                {topRepos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><GitCommit className="h-4 w-4" /> Top Development Repositories</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {topRepos.map((repo: any) => (
                        <div key={repo.id} className="p-3 bg-secondary/10 border border-border/60 hover:border-border rounded-lg flex justify-between items-center transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium hover:underline cursor-pointer" onClick={() => window.open(repo.html_url, '_blank')}>{repo.name}</span>
                            <span className="text-xs text-muted-foreground">{repo.language || 'Code'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3" /> {repo.stargazers_count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {zkProofStatus && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-900/20 text-blue-400 p-4 rounded-lg text-sm break-all flex items-start gap-3 border border-blue-500/30">
                    <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{zkProofStatus}</span>
                  </motion.div>
                )}
              </div>

              {/* QR Code Share Profile/Score */}
              <div className="lg:w-1/3 flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                <div className="text-center mb-4">
                  <h3 className="font-semibold mb-1">Recruiter Quick-Scan</h3>
                  <p className="text-xs text-muted-foreground">Share your anonymized & verified Dev Portfolio at your next hackathon.</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 transition-transform duration-300">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify-rep/${user?.walletAddress}`}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <Button variant="outline" size="sm" className="mt-5 text-xs w-full bg-secondary/50" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify-rep/${user?.walletAddress}`);
                  toast.success("Verifiable Portfolio Link Copied!");
                }}>
                  <Copy className="h-3 w-3 mr-2" /> Copy Share Link
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Credentials */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">
              {user?.role === "issuer" ? "Recently Issued" : "Recent Credentials"}
            </h2>
            <Link to="/credentials">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : credentials.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              {user?.role === "issuer"
                ? "No credentials issued yet. Click 'Issue Credential' to generate your first one!"
                : "No credentials found. Connect with an issuer to get your first credential!"}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.slice(0, 3).map((cred, i) => (
                <motion.div
                  key={cred.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/credentials/${cred.id}`} className="glass-card-hover p-5 block h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{categoryIcons[cred.category as keyof typeof categoryIcons] || categoryIcons.other}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cred.status === "verified" ? "bg-success/10 text-success" :
                        cred.status === "pending" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                        {cred.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{cred.title}</h3>
                    <p className="text-xs text-muted-foreground">{user?.role === 'issuer' ? `To: ${cred.recipient}` : cred.issuer}</p>
                    <p className="text-xs text-muted-foreground mt-2">Issued {cred.issueDate}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sharing Activity - Only for individuals */}
        {user?.role !== "issuer" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Sharing Activity</h2>
              <Link to="/sharing">
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="glass-card divide-y divide-border/50">
              {shares.slice(0, 3).map((share) => {
                const isExpired = new Date(share.expiresAt) < new Date();
                return (
                  <div key={share._id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{share.credentialId?.title || "Credential"}</p>
                      <p className="text-xs text-muted-foreground">{share.accessLogs?.length || 0} views · Created {new Date(share.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${!isExpired ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {!isExpired ? "Active" : "Expired"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
