'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { APP_GATEWAY_ABI, ERC20_ABI, SUPER_TOKEN_CONTRACT_ID, VAULT_CONTRACT_ID, CHAIN_INFO, CHAIN_SLUGS } from '@/constants';
import { ABSTRACTED_SUPER_TOKEN_CONTRACT_ID } from '@/constants/contractIds';
import { getAppGatewayContract, getOnChainAddress } from '@/utils/contracts';
import DepositMintPanel from './DepositMintPanel';

const CHAIN_SLUG_SUPERTOKEN = CHAIN_SLUGS.ARBITRUM_SEPOLIA;
const CHAIN_SLUG_VAULT = CHAIN_SLUGS.ARBITRUM_SEPOLIA;
const CHAIN_SLUG_ABSTRACTED_SUPERTOKEN = CHAIN_SLUGS.OPTIMISM_SEPOLIA;

export default function TokenDashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [superTokenAddress, setSuperTokenAddress] = useState<string>('');
  const [abstractedSuperTokenAddress, setAbstractedSuperTokenAddress] = useState<string>('');
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const [superTokenBalance, setSuperTokenBalance] = useState<string>('');
  const [optSuperTokenBalance, setOptSuperTokenBalance] = useState<string>('');
  const [unmintedBalance, setUnmintedBalance] = useState<string>('');
  const [lockedBalance, setLockedBalance] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Connect wallet logic (from WalletIndicator)
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (err) {
          setError('Error checking wallet connection');
        }
      }
    };
    checkConnection();
    const handleAccountsChanged = (accounts: string[]) => {
      setAddress(accounts[0] ? accounts[0].toString() : null);
    };
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask to use this feature');
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0].toString());
      setError(null);
    } catch (err) {
      setError('Error connecting wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch contract addresses
  useEffect(() => {
    async function fetchAddresses() {
      try {
        const [superToken, abstractedSuperToken, vault] = await Promise.all([
          getOnChainAddress(SUPER_TOKEN_CONTRACT_ID, CHAIN_SLUG_SUPERTOKEN),
          getOnChainAddress(ABSTRACTED_SUPER_TOKEN_CONTRACT_ID, CHAIN_SLUG_ABSTRACTED_SUPERTOKEN),
          getOnChainAddress(VAULT_CONTRACT_ID, CHAIN_SLUG_VAULT),
        ]);
        setSuperTokenAddress(superToken);
        setAbstractedSuperTokenAddress(abstractedSuperToken);
        setVaultAddress(vault);
      } catch (err) {
        setError('Error fetching contract addresses');
      }
    }
    fetchAddresses();
  }, []);

  // Fetch balances
  const fetchBalances = async () => {
    if (!address || !superTokenAddress || !abstractedSuperTokenAddress) return;
    try {
      // Arb SuperToken (421614)
      const arbProvider = new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUG_SUPERTOKEN].rpc);
      const arbSuperToken = new ethers.Contract(superTokenAddress, ERC20_ABI, arbProvider);
      const arbBalance = await arbSuperToken.balanceOf(address);
      setSuperTokenBalance(ethers.utils.formatUnits(arbBalance, 18));
      // Opt SuperToken (11155420)
      const optProvider = new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUG_ABSTRACTED_SUPERTOKEN].rpc);
      const optSuperToken = new ethers.Contract(abstractedSuperTokenAddress, ERC20_ABI, optProvider);
      const optBalance = await optSuperToken.balanceOf(address);
      setOptSuperTokenBalance(ethers.utils.formatUnits(optBalance, 18));
    } catch (err) {
      console.error(err);
      setError('Error fetching superToken balances');
    }
  };
  useEffect(() => { fetchBalances(); }, [address, superTokenAddress, abstractedSuperTokenAddress]);

  // Fetch unmintedBalance and lockedBalance from app gateway
  const fetchGatewayBalances = async () => {
    if (!address) return;
    try {
      // Use provider for chain 421614 (where app gateway is deployed)
      const provider = new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUGS.EVMX].rpc);
      const appGateway = getAppGatewayContract();
      const [unminted, locked] = await Promise.all([
        appGateway.unmintedBalance(address),
        appGateway.lockedBalance(address),
      ]);
      setUnmintedBalance(ethers.utils.formatUnits(unminted, 18));
      setLockedBalance(ethers.utils.formatUnits(locked, 18));
    } catch (err) {
      setError('Error fetching app gateway balances');
    }
  };
  useEffect(() => { fetchGatewayBalances(); }, [address]);

  const refreshBalances = async () => {
    await fetchBalances();
    await fetchGatewayBalances();
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-8 bg-gray-900 rounded-xl shadow-lg space-y-6 text-gray-100">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Token Abstractor</h2>
      {!address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-colors"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex flex-col md:flex-row md:gap-12 gap-8 w-full">
          {/* Left: Addresses */}
          <div className="space-y-4 min-w-[440px] max-w-[520px] flex-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="mb-2 break-words">
                <span className="font-medium text-gray-200">Vault:</span>
                <span className="ml-2 font-mono text-xs text-gray-400 break-all">{vaultAddress}</span>
              </div>
              <div className="mb-2 break-words">
                <span className="font-medium text-gray-200">Arb Token:</span>
                <span className="ml-2 font-mono text-xs text-gray-400 break-all">{superTokenAddress}</span>
              </div>
              <div className="mb-2 break-words">
                <span className="font-medium text-gray-200">Opt Token:</span>
                <span className="ml-2 font-mono text-xs text-gray-400 break-all">{abstractedSuperTokenAddress}</span>
              </div>
            </div>
          </div>
          {/* Divider for desktop */}
          <div className="hidden md:block border-l border-gray-700 mx-2"></div>
          {/* Right: Balances */}
          <div className="space-y-4 min-w-[340px] flex-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="mb-2">
                <span className="font-medium text-gray-200">Arb Token Balance:</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{superTokenBalance || '0'}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-200">Opt Token Balance:</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{optSuperTokenBalance || '0'}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-200">Unminted Balance:</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{unmintedBalance || '0'}</span>
              </div>
              {/* <div className="mb-2">
                <span className="font-medium text-gray-200">Locked Balance:</span>
                <span className="ml-2 font-mono text-xs text-gray-400">{lockedBalance || '0'}</span>
              </div> */}
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {address && superTokenAddress && vaultAddress && (
        <DepositMintPanel
          userAddress={address}
          superTokenAddress={superTokenAddress}
          vaultAddress={vaultAddress}
          refreshBalances={refreshBalances}
          unmintedBalance={unmintedBalance}
          lockedBalance={lockedBalance}
        />
      )}
    </div>
  );
} 