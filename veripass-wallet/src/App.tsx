import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Credentials from "./pages/Credentials";
import CredentialDetail from "./pages/CredentialDetail";
import Verify from "./pages/Verify";
import Sharing from "./pages/Sharing";
import Profile from "./pages/Profile";
import About from "./pages/About";
import IssueCredential from "./pages/IssueCredential";
import IssuerProfile from "./pages/IssuerProfile";
import VerifyDev from "./pages/VerifyDev";
import GovPortal from "./pages/GovPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/credentials/:id" element={<CredentialDetail />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify-rep/:walletAddress" element={<VerifyDev />} />
            <Route path="/sharing" element={<Sharing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/issuer/issue" element={<IssueCredential />} />
            <Route path="/issuer/profile" element={<IssuerProfile />} />
            <Route path="/gov" element={<GovPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
