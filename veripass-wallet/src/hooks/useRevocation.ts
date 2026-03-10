import { useContracts } from './useContracts';

/**
 * useRevocation — check and perform credential revocation directly on-chain.
 */
export const useRevocation = () => {
  const { getSignerAndContracts, getReadOnlyContracts } = useContracts();

  /**
   * Revoke a credential. Requires ADMIN MetaMask account.
   * Writes to RevocationRegistry on-chain.
   */
  const revokeCredential = async (docHash: string, reason: string) => {
    const { revocationRegistry } = await getSignerAndContracts();
    const tx = await revocationRegistry.revoke(docHash, reason);
    return tx.wait();
  };

  /**
   * Check if a credential is revoked — reads from chain, no backend.
   * Works even if the backend is down or the internet is slow.
   */
  const isRevoked = async (docHash: string): Promise<boolean> => {
    const { revocationRegistry } = getReadOnlyContracts();
    return await revocationRegistry.isRevoked(docHash);
  };

  /**
   * Get full revocation record — reason, who revoked it, when.
   */
  const getRevocationDetails = async (docHash: string) => {
    const { revocationRegistry } = getReadOnlyContracts();
    const details = await revocationRegistry.getRevocationDetails(docHash);
    return {
      reason:    details.reason,
      revokedBy: details.revokedBy,
      timestamp: new Date(Number(details.timestamp) * 1000),
    };
  };

  return { revokeCredential, isRevoked, getRevocationDetails };
};
