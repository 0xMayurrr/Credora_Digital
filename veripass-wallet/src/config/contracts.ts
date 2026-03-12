/**
 * Credora now uses Hyperledger Fabric (not Solidity contracts)
 * All blockchain interactions go through the REST API backend
 * which connects to Fabric chaincodes via Gateway SDK
 */

export const FABRIC_CONFIG = {
  CHANNEL_NAME: 'credora-main-channel',
  CHAINCODES: {
    CERTIFICATE_LIFECYCLE: 'certificate-lifecycle-cc',
    CREDENTIAL_REGISTRY: 'credential-registry-cc',
    REVOCATION_REGISTRY: 'revocation-registry-cc',
    IDENTITY_MANAGEMENT: 'identity-management-cc',
  },
  ORGANIZATIONS: {
    GOVERNMENT: 'GovernmentMSP',
    UNIVERSITY: 'UniversityMSP',
    VERIFIER: 'VerifierMSP',
  }
} as const;
