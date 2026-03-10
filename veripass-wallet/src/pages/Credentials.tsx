import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { categoryIcons, categoryColors } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const categories = ["all", "education", "employment", "certification", "license", "award", "other"];

const Credentials = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            isGov: false
          }));

          let govMapped: any[] = [];
          if (user?.role !== 'issuer') {
            try {
              const govRes = await api.certificates.getAll(token);
              if (govRes.success) {
                govMapped = govRes.data.map((c: any) => ({
                  id: c.docHash,
                  title: c.title,
                  issuer: "Government Agency",
                  recipient: c.issuedToWallet?.substring(0, 10) + '...',
                  category: "certification",
                  status: c.state === 'REVOKED' ? "revoked" : "verified",
                  description: c.description,
                  issueDate: new Date(c.createdAt || new Date()).toLocaleDateString(),
                  expiryDate: null,
                  isGov: true
                }));
              }
            } catch (e) { }
          }

          setCredentials([...mapped, ...govMapped]);
        }
      } catch (err) {
        console.error("Failed to fetch credentials", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreds();
  }, []);

  const filtered = credentials.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.issuer.toLowerCase().includes(search.toLowerCase()) ||
      (c.recipient && c.recipient.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === "all" || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{user?.role === 'issuer' ? "Issued Credentials" : "Credential Wallet"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.role === 'issuer' ? "Manage credentials you have issued" : "Manage and browse all your verified credentials"}</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              onClick={() => setCategory(cat)}
              className={`capitalize text-xs ${category === cat
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-secondary"
                }`}
            >
              {cat !== "all" && <span className="mr-1">{categoryIcons[cat as keyof typeof categoryIcons] || categoryIcons.other}</span>}
              {cat}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cred, i) => (
                <motion.div
                  key={cred.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/credentials/${cred.id}`} className="glass-card-hover p-5 block h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${categoryColors[cred.category as keyof typeof categoryColors] || categoryColors.other}`}>
                          {categoryIcons[cred.category as keyof typeof categoryIcons] || categoryIcons.other} {cred.category}
                        </span>
                        {cred.isGov && <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">Official Gov. Issue 🏛️</span>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cred.status === "verified" ? "bg-success/10 text-success" :
                        cred.status === "pending" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                        {cred.status}
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{cred.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 font-semibold">{user?.role === 'issuer' ? `Recipient: ${cred.recipient}` : `Issued by: ${cred.issuer}`}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{cred.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Issued {cred.issueDate}</span>
                      {cred.expiryDate && <span className="text-xs text-muted-foreground">Exp {cred.expiryDate}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No credentials found matching your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Credentials;
