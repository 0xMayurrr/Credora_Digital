import React, { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { api } from "@/lib/api";

export type UserRole = "user" | "issuer" | "ISSUER_OFFICER" | "APPROVER" | "ADMIN" | "CITIZEN" | "UNIVERSITY";

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
  loginWithWallet: (role?: string, extraFields?: Record<string, string>) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole, extraFields?: Record<string, string>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/**
 * Prioritizes the backend role which is verified against the Hyperledger Fabric Gateway.
 * No longer uses on-chain role verification since we migrated to Fabric.
 */
const getRoleFromChain = async (walletAddress: string, backendRole: UserRole): Promise<UserRole> => {
  // Backend role is the source of truth (verified against Fabric MSP)
  return backendRole || "CITIZEN";
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
      persistUser({ ...userData, loginMethod: "email" });
      localStorage.setItem("deid_token", token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithWallet = useCallback(async (role?: string, extraFields?: Record<string, string>) => {
    setIsLoading(true);
    if (!(window as any).ethereum) {
      setIsLoading(false);
      throw new Error("MetaMask not installed");
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];

      const { nonce } = await api.auth.getNonce(address, role, extraFields);
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [nonce, address],
      });

      const { token, user: userData } = await api.auth.verifyWallet(address, signature);
      const effectiveRole: UserRole = (userData.role as UserRole) || "CITIZEN";

      persistUser({
        ...userData,
        role: effectiveRole,
        loginMethod: "wallet",
      });
      localStorage.setItem("deid_token", token);
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole, extraFields?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const { token, user: userData } = await api.auth.signup(email, password, name, role, extraFields);
      persistUser({ ...userData, loginMethod: "email" });
      localStorage.setItem("deid_token", token);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
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

