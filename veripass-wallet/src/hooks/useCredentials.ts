import { api } from '@/lib/api';

/**
 * useCredentials — issues and verifies credentials on Hyperledger Fabric.
 */
export const useCredentials = () => {

  /**
   * Issue a credential.
   * Calls the backend which performs Fabric Gov-SDK issuance.
   */
  const issueCredential = async (
    subject: string,       // recipient wallet
    credentialType: string,
    title: string,
    description: string,
    file: File,
    expirationDate?: string
  ) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");

    const formData = new FormData();
    formData.append("recipientWallet", subject);
    formData.append("credentialType", credentialType);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", credentialType);
    if (expirationDate) formData.append("expiryDate", expirationDate);
    formData.append("document", file);

    const res = await api.credentials.issue(formData, token);
    return res.data;
  };

  /** Verify via Fabric REST Bridge */
  const verifyCredential = async (credentialId: string) => {
    const res = await api.credentials.getById(credentialId, ""); // public check often
    return {
      isValid:         !res.data.revoked,
      isExpired:       res.data.expiryDate ? new Date(res.data.expiryDate) < new Date() : false,
      isRevoked:       res.data.revoked,
      issuer:          res.data.issuerId?.organizationName || "Official Issuer",
      subject:         res.data.recipientWallet,
      credentialType:  res.data.category,
      issuedAt:        new Date(res.data.issuedAt || res.data.createdAt),
    };
  };

  /** Get credentials for current user */
  const getMyCredentials = async () => {
    const token = localStorage.getItem("deid_token");
    if (!token) return [];
    const res = await api.credentials.getAll(token);
    return res.data;
  };

  /** Revoke on Fabric via backend */
  const revokeOnChain = async (credentialId: string) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");
    return await api.credentials.revoke(credentialId, token);
  };

  return { issueCredential, verifyCredential, getMyCredentials, revokeOnChain };
};
