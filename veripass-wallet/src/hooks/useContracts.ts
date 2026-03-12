/**
 * Fabric-based hooks - All operations go through REST API
 * No direct contract calls anymore
 */

import { api } from '@/lib/api';

export const useContracts = () => {
  /**
   * All blockchain operations now go through the backend REST API
   * which connects to Hyperledger Fabric chaincodes
   * 
   * Use the api.certificates and api.credentials methods instead
   */
  
  const fabricInfo = {
    message: 'Credora now uses Hyperledger Fabric',
    backend: 'All operations go through REST API → Fabric Gateway SDK',
    chaincodes: [
      'certificate-lifecycle-cc',
      'credential-registry-cc', 
      'revocation-registry-cc',
      'identity-management-cc'
    ],
    organizations: ['GovernmentMSP', 'UniversityMSP', 'VerifierMSP']
  };

  return { fabricInfo };
};
