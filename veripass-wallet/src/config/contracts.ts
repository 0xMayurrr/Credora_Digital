/**
 * Contract addresses — update these AFTER running:
 * cd deid-core/blockchain && npx hardhat run scripts/deploy.js --network amoy
 *
 * Then run: node scripts/copy-abis.js   (copies compiled ABIs to this folder's ../abis/)
 */
export const CONTRACT_ADDRESSES = {
  CREDENTIAL_REGISTRY:   import.meta.env.VITE_CREDENTIAL_REGISTRY_ADDRESS   || "0x0000000000000000000000000000000000000000",
  CERTIFICATE_LIFECYCLE: import.meta.env.VITE_LIFECYCLE_CONTRACT_ADDRESS     || "0x0000000000000000000000000000000000000000",
  ROLE_MANAGER:          import.meta.env.VITE_ROLE_MANAGER_ADDRESS           || "0x0000000000000000000000000000000000000000",
  REVOCATION_REGISTRY:   import.meta.env.VITE_REVOCATION_REGISTRY_ADDRESS    || "0x0000000000000000000000000000000000000000",
} as const;

export const NETWORK_CONFIG = {
  POLYGON_AMOY: {
    chainId: 80002,
    chainIdHex: "0x13882",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    name: "Polygon Amoy",
  },
  SEPOLIA: {
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_KEY || ""}`,
    explorerUrl: "https://sepolia.etherscan.io",
    name: "Ethereum Sepolia",
  },
} as const;

// Change this to switch active network
export const ACTIVE_NETWORK = NETWORK_CONFIG.SEPOLIA;
