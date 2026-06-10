/**
 * metamask.js — MetaMask wallet helpers (ethers.js v6 syntax)
 *
 * connectWallet() : requests MetaMask access, returns { provider, signer, address }
 * getProvider()   : returns a read-only BrowserProvider (no popup)
 */

import { ethers } from "ethers";

/**
 * connectWallet — prompts MetaMask connection popup.
 * @returns {{ provider, signer, address }}
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed. Please install MetaMask to continue.");
  }

  // Request wallet access (triggers MetaMask popup)
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // ethers v6: BrowserProvider wraps window.ethereum
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  const address  = await signer.getAddress();

  return { provider, signer, address };
};

/**
 * getProvider — read-only provider, no MetaMask popup.
 * Use for reading blockchain data without signing transactions.
 */
export const getProvider = () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * getCurrentAccount — returns connected account or null (no popup).
 */
export const getCurrentAccount = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};
