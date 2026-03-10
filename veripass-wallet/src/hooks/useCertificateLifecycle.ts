import { ethers } from 'ethers';
import { useContracts } from './useContracts';

const STATE_NAMES: Record<number, string> = {
  0: 'DRAFT',
  1: 'UNDER_REVIEW',
  2: 'APPROVED',
  3: 'SIGNED',
  4: 'ISSUED',
  5: 'REVOKED',
};

/**
 * useCertificateLifecycle — full government certificate workflow, all on-chain.
 *
 * Unlike useCredentials, this does NOT use EIP-712 — each role-gated function
 * is called directly. The RoleManager contract guards access.
 */
export const useCertificateLifecycle = () => {
  const { getSignerAndContracts, getReadOnlyContracts } = useContracts();

  /**
   * OFFICER: Create a new certificate draft on-chain.
   */
  const createDraft = async (
    recipientAddress: string,
    metadataURI: string,         // ipfs://CID of document
    requiredApprovals: number,
    designatedApprovers: string[]
  ) => {
    const { certificateLifecycle } = await getSignerAndContracts();
    const tx = await certificateLifecycle.createDraft(
      recipientAddress,
      recipientAddress,              // issuedTo
      metadataURI,
      requiredApprovals,
      designatedApprovers
    );
    const receipt = await tx.wait();

    // Parse CertificateStateChanged event to get docHash
    const iface = certificateLifecycle.interface;
    const event = receipt.logs
      .map((log: any) => { try { return iface.parseLog(log); } catch { return null; } })
      .find((e: any) => e?.name === 'CertificateStateChanged');

    return {
      receipt,
      txHash: receipt.hash,
      docHash: event?.args?.docHash as string | undefined,
    };
  };

  /** OFFICER: Move DRAFT → UNDER_REVIEW */
  const submitForReview = async (docHash: string) => {
    const { certificateLifecycle } = await getSignerAndContracts();
    const tx = await certificateLifecycle.submitForReview(docHash);
    return tx.wait();
  };

  /** APPROVER: Move UNDER_REVIEW → APPROVED (multi-sig: may take multiple calls) */
  const approveCertificate = async (docHash: string) => {
    const { certificateLifecycle } = await getSignerAndContracts();
    const tx = await certificateLifecycle.approveCertificate(docHash);
    return tx.wait();
  };

  /** APPROVER: Move APPROVED → SIGNED */
  const signCertificate = async (docHash: string) => {
    const { certificateLifecycle } = await getSignerAndContracts();
    const tx = await certificateLifecycle.signCertificate(docHash);
    return tx.wait();
  };

  /** OFFICER: Move SIGNED → ISSUED */
  const issueCertificate = async (docHash: string) => {
    const { certificateLifecycle } = await getSignerAndContracts();
    const tx = await certificateLifecycle.issueCertificate(docHash);
    return tx.wait();
  };

  /**
   * Get the certificate's current state, directly from the contract.
   */
  const getCertificateState = async (docHash: string) => {
    const { certificateLifecycle } = getReadOnlyContracts();
    const cert = await certificateLifecycle.getCertificate(docHash);
    return {
      state:     STATE_NAMES[Number(cert.state)],
      issuedTo:  cert.issuedTo,
      createdBy: cert.createdBy,
      ipfsURI:   cert.metadataURI,
      isRevoked: cert.isRevoked,
    };
  };

  /**
   * Get full lifecycle history by querying CertificateStateChanged events.
   * This is a pure on-chain audit trail — cannot be faked.
   */
  const getCertificateHistory = async (docHash: string) => {
    const { certificateLifecycle } = getReadOnlyContracts();
    const filter = certificateLifecycle.filters.CertificateStateChanged(docHash);
    const events = await certificateLifecycle.queryFilter(filter, 0, 'latest');

    return events.map((e: any) => ({
      state:     STATE_NAMES[Number(e.args.newState)],
      changedBy: e.args.changedBy,
      timestamp: new Date(Number(e.args.timestamp) * 1000),
      txHash:    e.transactionHash,
    }));
  };

  return {
    createDraft,
    submitForReview,
    approveCertificate,
    signCertificate,
    issueCertificate,
    getCertificateState,
    getCertificateHistory,
  };
};
