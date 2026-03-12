import { api } from '@/lib/api';

/**
 * useCertificateLifecycle — government certificate workflow powered by Hyperledger Fabric.
 */
export const useCertificateLifecycle = () => {

  /**
   * OFFICER: Create a new certificate draft.
   */
  const createDraft = async (
    recipientAddress: string,
    title: string,
    designatedApprovers: string[],
    file: File
  ) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("issuedToWallet", recipientAddress);
    formData.append("designatedApprovers", JSON.stringify(designatedApprovers));
    formData.append("requiredApprovals", String(designatedApprovers.length));
    formData.append("document", file);

    const res = await api.certificates.create(formData, token);
    return res.data;
  };

  /** Move state (UNDER_REVIEW, APPROVED, SIGNED, ISSUED, REVOKED) */
  const updateState = async (docHash: string, newState: string) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");
    return await api.certificates.updateState(docHash, newState, token);
  };

  const getCertificate = async (docHash: string) => {
    const token = localStorage.getItem("deid_token");
    if (!token) throw new Error("No auth token");
    return await api.certificates.getById(docHash, token);
  };

  return {
    createDraft,
    submitForReview: (docHash: string) => updateState(docHash, 'UNDER_REVIEW'),
    approveCertificate: (docHash: string) => updateState(docHash, 'APPROVED'),
    signCertificate: (docHash: string) => updateState(docHash, 'SIGNED'),
    issueCertificate: (docHash: string) => updateState(docHash, 'ISSUED'),
    revokeCertificate: (docHash: string) => updateState(docHash, 'REVOKED'),
    getCertificate,
  };
};
