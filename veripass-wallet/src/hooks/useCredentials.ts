import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { CONTRACT_ADDRESSES, ACTIVE_NETWORK } from '@/config/contracts';

/**
 * useCredentials — issues and verifies credentials DIRECTLY on-chain.
 *
 * Key security properties:
 * - Issuance: issuer signs via their own MetaMask (EIP-712). Server cannot fake this.
 * - Verification: reads from chain via public RPC. No backend call needed.
 */
export const useCredentials = () => {
  const { getSignerAndContracts, getReadOnlyContracts } = useContracts();

  /**
   * Issue a credential on-chain.
   * The issuer's MetaMask must sign an EIP-712 typed data message.
   *
   * Flow:
   * 1. Upload document to IPFS (call api.ipfs.upload() first — that's fine, IPFS is not blockchain)
   * 2. Call this function with the returned IPFS URI
   * 3. MetaMask pops up twice: once to sign (EIP-712), once to send the transaction
   */
  const issueCredential = async (
    subject: string,       // recipient wallet
    credentialType: string,
    ipfsMetadataURI: string,
    expirationDate: number  // Unix timestamp, 0 = no expiry
  ) => {
    const { credentialRegistry, signer } = await getSignerAndContracts();

    const domain = {
      name: 'CredoraRegistry',
      version: '1',
      chainId: (await signer.provider!.getNetwork()).chainId,
      verifyingContract: CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY,
    };

    const types = {
      Credential: [
        { name: 'subject',         type: 'address' },
        { name: 'credentialType',  type: 'string'  },
        { name: 'metadataURI',     type: 'string'  },
        { name: 'expirationDate',  type: 'uint256' },
      ],
    };

    const value = { subject, credentialType, metadataURI: ipfsMetadataURI, expirationDate };

    // Step 1: EIP-712 sign from issuer's own wallet
    const signature = await signer.signTypedData(domain, types, value);

    // Step 2: Send the tx — the contract verifies the signature matches msg.sender
    const tx = await credentialRegistry.issueCredential(
      subject,
      credentialType,
      ipfsMetadataURI,
      expirationDate,
      signature
    );
    const receipt = await tx.wait();

    // Parse CredentialIssued event to get the on-chain credentialId
    const iface = credentialRegistry.interface;
    const event = receipt.logs
      .map((log: any) => { try { return iface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === 'CredentialIssued');

    return {
      receipt,
      txHash: receipt.hash,
      credentialId: event?.args?.credentialId as string | undefined,
    };
  };

  /**
   * Verify a credential — reads directly from blockchain.
   * Does NOT call the backend. Works even if the backend is down.
   */
  const verifyCredential = async (credentialId: string) => {
    const { credentialRegistry } = getReadOnlyContracts();
    const result = await credentialRegistry.verifyCredential(credentialId);
    return {
      isValid:         result.isValid,
      isExpired:       result.isExpired,
      isRevoked:       result.isRevoked,
      issuer:          result.issuer,
      subject:         result.subject,
      credentialType:  result.credentialType,
      issuedAt:        new Date(Number(result.issuedAt) * 1000),
      explorerUrl:     `${ACTIVE_NETWORK.explorerUrl}/address/${result.issuer}`,
    };
  };

  /**
   * Get all credentials for the connected wallet — reads from blockchain.
   */
  const getMyCredentials = async () => {
    const { credentialRegistry, address } = await getSignerAndContracts();
    const credentialIds: string[] = await credentialRegistry.getCredentialsBySubject(address);
    const credentials = await Promise.all(
      credentialIds.map((id: string) => credentialRegistry.getCredential(id))
    );
    return credentials.map((c: any, i: number) => ({
      credentialId: credentialIds[i],
      issuer:        c.issuer,
      subject:       c.subject,
      credentialType: c.credentialType,
      metadataURI:   c.metadataURI,
      issuedAt:      new Date(Number(c.issuedAt) * 1000),
      revoked:       c.revoked,
    }));
  };

  /**
   * Revoke a credential — only the original issuer can do this.
   */
  const revokeOnChain = async (credentialId: string) => {
    const { credentialRegistry } = await getSignerAndContracts();
    const tx = await credentialRegistry.revokeCredential(credentialId);
    return tx.wait();
  };

  return { issueCredential, verifyCredential, getMyCredentials, revokeOnChain };
};
