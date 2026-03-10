import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/lib/api";

export type UserRole = "user" | "issuer" | "ISSUER_OFFICER" | "APPROVER" | "ADMIN" | "CITIZEN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  did: string;
  walletAddress?: string;
  avatar?: string;
  loginMethod: "wallet" | "email";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithWallet: (role?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("deid_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const persistUser = (u: User) => {
    setUser(u);
    localStorage.setItem("deid_user", JSON.stringify(u));
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: userData } = await api.auth.login(email, password);
      const u: User = { ...userData, loginMethod: "email" as const };
      persistUser(u);
      localStorage.setItem("deid_token", token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithWallet = useCallback(async (role?: string) => {
    setIsLoading(true);
    if (!(window as any).ethereum) {
      setIsLoading(false);
      throw new Error("MetaMask not installed");
    }
    try {
      // Force MetaMask to prompt account selection even if previously connected
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];

      const { nonce } = await api.auth.getNonce(address, role);

      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [nonce, address],
      });

      const { token, user: userData } = await api.auth.verifyWallet(address, signature);

      const u: User = { ...userData, loginMethod: "wallet" as const };
      persistUser(u);
      localStorage.setItem("deid_token", token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { token, user: userData } = await api.auth.signup(email, password, name, role);
      const u: User = { ...userData, loginMethod: "email" as const };
      persistUser(u);
      localStorage.setItem("deid_token", token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("deid_user");
    localStorage.removeItem("deid_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginWithWallet, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
