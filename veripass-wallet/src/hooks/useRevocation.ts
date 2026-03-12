/**
 * useRevocation — Fabric-based revocation via REST API
 */

import { api } from '@/lib/api';

export const useRevocation = () => {
  /**
   * Check if a credential is revoked via backend API
   */
  const isRevoked = async (credentialId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("deid_token") || "";
      const res = await api.credentials.getById(credentialId, token);
      return res.data?.revoked || false;
    } catch {
      return false;
    }
  };

  /**
   * Get revocation details from backend
   */
  const getRevocationDetails = async (credentialId: string) => {
    const token = localStorage.getItem("deid_token") || "";
    const res = await api.credentials.getById(credentialId, token);
    return {
      reason: 'Revoked by issuer',
      revokedBy: res.data?.issuerId?.walletAddress || 'Unknown',
      timestamp: res.data?.updatedAt ? new Date(res.data.updatedAt) : new Date(),
    };
  };

  /**
   * Revoke a credential via backend API (calls Fabric chaincode)
   */
  const revokeCredential = async (credentialId: string, reason: string) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");
    return await api.credentials.revoke(credentialId, token);
  };

  return { revokeCredential, isRevoked, getRevocationDetails };
};
