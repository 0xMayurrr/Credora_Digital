import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Wallet, Mail, Loader2, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Signup = () => {
  const { signup, loginWithWallet, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill all fields"); return; }
    try {
      await signup(email, password, name, role);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch { toast.error("Signup failed"); }
  };

  const handleWallet = async () => {
    try {
      await loginWithWallet(role);
      toast.success("Wallet connected!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Wallet connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <img src="/credora-high-resolution-logo-transparent.png" alt="Credora" className="h-8 logo-filter" />
        </Link>

        <h1 className="font-display text-2xl font-bold text-center mb-2">Create Your Wallet</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Start owning your credentials today</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { value: "CITIZEN" as UserRole, label: "Citizen", icon: User },
            { value: "ISSUER_OFFICER" as UserRole, label: "Gov Officer", icon: Building2 },
            { value: "APPROVER" as UserRole, label: "Approver", icon: Shield },
            { value: "ADMIN" as UserRole, label: "Admin", icon: Shield },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                role === r.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/50"
              )}
            >
              <r.icon className="h-4 w-4" />
              {r.label}
            </button>
          ))}
        </div>

        <Button variant="outline" className="w-full mb-6 gap-2 border-border hover:bg-secondary h-12" onClick={handleWallet} disabled={isLoading}>
          <Wallet className="h-4 w-4" />
          Connect MetaMask
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or sign up with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="mt-1 bg-secondary/50 border-border" />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 bg-secondary/50 border-border" />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 bg-secondary/50 border-border" />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Create Account
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
