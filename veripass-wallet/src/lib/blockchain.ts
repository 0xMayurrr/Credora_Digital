import { ethers } from 'ethers';

const RPC_URL = import.meta.env.VITE_BLOCKCHAIN_RPC;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const DID_REGISTRY_ABI = [
  'function createDID(string memory didDocument) external returns (string memory)',
  'function resolveDID(string memory did) external view returns (string memory)',
  'function updateDID(string memory did, string memory didDocument) external',
];

const LIFECYCLE_ABI = [
  'function submitForReview(bytes32 docHash) external',
  'function approveDocument(bytes32 docHash) external',
  'function signDocument(bytes32 docHash) external',
  'function issueCertificate(bytes32 docHash) external',
  'function revokeCertificate(bytes32 docHash, string memory reason) external',
  'function getCertificate(bytes32 docHash) external view returns (tuple(bytes32 docHash, address creator, address issuedTo, uint8 state, uint256 requiredApprovals, uint256 approvalCount, string metadataURI))',
  'event CertificateStateChanged(bytes32 indexed docHash, uint8 newState)',
  'event CertificateApproved(bytes32 indexed docHash, address indexed approver)'
];

const LIFECYCLE_ADDRESS = import.meta.env.VITE_LIFECYCLE_CONTRACT_ADDRESS;

export const blockchain = {
  getProvider: () => {
    if ((window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider(RPC_URL);
  },

  createDID: async (didDocument: any) => {
    const provider = blockchain.getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DID_REGISTRY_ABI, signer);
    const tx = await contract.createDID(JSON.stringify(didDocument));
    const receipt = await tx.wait();
    return receipt;
  },

  resolveDID: async (did: string) => {
    const provider = blockchain.getProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DID_REGISTRY_ABI, provider);
    const didDocument = await contract.resolveDID(did);
    return JSON.parse(didDocument);
  },

  connectWallet: async () => {
    if (!(window as any).ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { address, signer };
  },

  certificateLifecycle: {
    submitForReview: async (docHash: string) => {
      const { signer } = await blockchain.connectWallet();
      const contract = new ethers.Contract(LIFECYCLE_ADDRESS, LIFECYCLE_ABI, signer);
      const tx = await contract.submitForReview(docHash);
      return tx.wait();
    },
    approve: async (docHash: string) => {
      const { signer } = await blockchain.connectWallet();
      const contract = new ethers.Contract(LIFECYCLE_ADDRESS, LIFECYCLE_ABI, signer);
      const tx = await contract.approveDocument(docHash);
      return tx.wait();
    },
    sign: async (docHash: string) => {
      const { signer } = await blockchain.connectWallet();
      const contract = new ethers.Contract(LIFECYCLE_ADDRESS, LIFECYCLE_ABI, signer);
      const tx = await contract.signDocument(docHash);
      return tx.wait();
    },
    issue: async (docHash: string) => {
      const { signer } = await blockchain.connectWallet();
      const contract = new ethers.Contract(LIFECYCLE_ADDRESS, LIFECYCLE_ABI, signer);
      const tx = await contract.issueCertificate(docHash);
      return tx.wait();
    },
    revoke: async (docHash: string, reason: string) => {
      const { signer } = await blockchain.connectWallet();
      const contract = new ethers.Contract(LIFECYCLE_ADDRESS, LIFECYCLE_ABI, signer);
      const tx = await contract.revokeCertificate(docHash, reason);
      return tx.wait();
    }
  }
};
