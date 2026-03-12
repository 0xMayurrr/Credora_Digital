/**
 * Credora Fabric Integration Layer
 * All blockchain operations now go through REST API → Fabric Gateway
 * MetaMask is only used for wallet signatures (authentication)
 */

import { ethers } from 'ethers';

export const blockchain = {
  /**
   * Connect MetaMask wallet for authentication signatures only
   * (Not for direct blockchain transactions anymore)
   */
  connectWallet: async () => {
    if (!(window as any).ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { address, signer, provider };
  },

  /**
   * Sign a message with MetaMask (used for Web3 authentication)
   */
  signMessage: async (message: string) => {
    const { signer } = await blockchain.connectWallet();
    return await signer.signMessage(message);
  },

  /**
   * Get current wallet address without prompting connection
   */
  getAddress: async () => {
    if (!(window as any).ethereum) return null;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const accounts = await provider.listAccounts();
    return accounts[0]?.address || null;
  }
};
