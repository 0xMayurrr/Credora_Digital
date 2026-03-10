import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ACTIVE_NETWORK } from '@/config/contracts';
import CredentialRegistryABI from '@/abis/CredentialRegistry.json';
import CertificateLifecycleABI from '@/abis/CertificateLifecycle.json';
import RoleManagerABI from '@/abis/RoleManager.json';
import RevocationRegistryABI from '@/abis/RevocationRegistry.json';

/**
 * Base hook that gives you signer-connected contract instances.
 * All other hooks use this internally.
 */
export const useContracts = () => {
  const getSignerAndContracts = async () => {
    if (!(window as any).ethereum) throw new Error('MetaMask not installed. Please install it from metamask.io');

    const provider = new ethers.BrowserProvider((window as any).ethereum);

    // Ensure user is on the correct network
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== ACTIVE_NETWORK.chainId) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
        });
      } catch (switchError: any) {
        // Chain doesn't exist in wallet — add it
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.name,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.explorerUrl],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      signer,
      address,
      provider,
      credentialRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY,
        CredentialRegistryABI.abi,
        signer
      ),
      certificateLifecycle: new ethers.Contract(
        CONTRACT_ADDRESSES.CERTIFICATE_LIFECYCLE,
        CertificateLifecycleABI.abi,
        signer
      ),
      roleManager: new ethers.Contract(
        CONTRACT_ADDRESSES.ROLE_MANAGER,
        RoleManagerABI.abi,
        signer
      ),
      revocationRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.REVOCATION_REGISTRY,
        RevocationRegistryABI.abi,
        signer
      ),
    };
  };

  /** Read-only provider — no signer needed, no MetaMask popup */
  const getReadOnlyContracts = () => {
    const provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
    return {
      credentialRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY,
        CredentialRegistryABI.abi,
        provider
      ),
      revocationRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.REVOCATION_REGISTRY,
        RevocationRegistryABI.abi,
        provider
      ),
      roleManager: new ethers.Contract(
        CONTRACT_ADDRESSES.ROLE_MANAGER,
        RoleManagerABI.abi,
        provider
      ),
      certificateLifecycle: new ethers.Contract(
        CONTRACT_ADDRESSES.CERTIFICATE_LIFECYCLE,
        CertificateLifecycleABI.abi,
        provider
      ),
    };
  };

  return { getSignerAndContracts, getReadOnlyContracts };
};
