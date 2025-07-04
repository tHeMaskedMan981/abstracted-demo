"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { APP_GATEWAY_ABI, ERC20_ABI, CHAIN_INFO, SUPER_TOKEN_CONTRACT_ID, VAULT_CONTRACT_ID, CHAIN_SLUGS, SUPPORTED_CHAINS } from '@/constants';
import { getAppGatewayContract, getAppGatewayContractWithSigner, getOnChainAddress } from '@/utils/contracts';
import { createPermitSignature } from '@/utils/permit';
import { STATUS_API } from "@/constants/api";

const CHAIN_SLUG_SUPERTOKEN = 421614; // Arbitrum Sepolia
const EVMX_CHAIN_SLUG = 43;
const EVMX_EXPLORER = CHAIN_INFO[EVMX_CHAIN_SLUG].explorerUrl;

export default function DepositMintPanel({
  userAddress,
  superTokenAddress,
  vaultAddress,
  refreshBalances,
  unmintedBalance,
  lockedBalance,
}: {
  userAddress: string;
  superTokenAddress: string;
  vaultAddress: string;
  refreshBalances: () => Promise<void>;
  unmintedBalance: string;
  lockedBalance: string;
}) {
  const [tab, setTab] = useState<'deposit' | 'mint'>('deposit');
  const [balance, setBalance] = useState<string>('0');
  const [amount, setAmount] = useState('');
  const [permitSig, setPermitSig] = useState<{v: number, r: string, s: string, deadline: number} | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<any>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // For Mint tab
  const [mintChain, setMintChain] = useState<number | null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<any>(null);
  const [isMintingTx, setIsMintingTx] = useState(false);
  const [isPollingMintStatus, setIsPollingMintStatus] = useState(false);
  const mintPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's supertoken balance
  useEffect(() => {
    async function fetchBalance() {
      if (!userAddress || !superTokenAddress) return;
      try {
        const provider = new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUG_SUPERTOKEN].rpc);
        const superToken = new ethers.Contract(superTokenAddress, ERC20_ABI, provider);
        const bal = await superToken.balanceOf(userAddress);
        setBalance(ethers.utils.formatUnits(bal, 18));
      } catch (err) {
        setBalance('0');
      }
    }
    fetchBalance();
  }, [userAddress, superTokenAddress]);

  // Reset permit when amount changes
  useEffect(() => { setPermitSig(null); }, [amount]);

  // Add a function to refresh balance
  const refreshBalance = async () => {
    if (!userAddress || !superTokenAddress) return;
    try {
      const provider = new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUG_SUPERTOKEN].rpc);
      const superToken = new ethers.Contract(superTokenAddress, ERC20_ABI, provider);
      const bal = await superToken.balanceOf(userAddress);
      setBalance(ethers.utils.formatUnits(bal, 18));
    } catch (err) {
      setBalance('0');
    }
  };

  // Poll for deposit status
  useEffect(() => {
    if (!depositTxHash) return;
    setIsPollingStatus(true);
    const start = Date.now();
    console.log(`[Deposit] Polling started at ${new Date(start).toISOString()} for tx:`, depositTxHash);
    const poll = async () => {
      try {
        const now = Date.now();
        const response = await fetch(`${STATUS_API}/getDetailsByTxHash?txHash=${depositTxHash}`);
        const data = await response.json();
        console.log(`[Deposit] Polled at ${new Date(now).toISOString()} - status:`, data.status, data.response?.[0]?.status);
        if (data.status === "SUCCESS" && data.response && data.response.length > 0) {
          setDepositStatus(data.response[0]);
          if (data.response[0]?.writePayloads[0]?.executeDetails?.isExecuted) {
            setError('Deposit successful!');

            const done = Date.now();
            console.log(`[Deposit] COMPLETED at ${new Date(done).toISOString()} (elapsed: ${(done-start)/1000}s)`);
            setIsPollingStatus(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            await refreshBalances();
            console.log(`[Deposit] Balances refreshed at ${new Date().toISOString()}`);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    poll();
    pollIntervalRef.current = setInterval(poll, 1000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [depositTxHash]);

  // Helper for max mintable
  const maxMintable = Math.max(
    parseFloat(unmintedBalance || '0') - parseFloat(lockedBalance || '0'),
    0
  );

  // Poll for mint status
  useEffect(() => {
    if (!mintTxHash) return;
    setIsPollingMintStatus(true);
    const start = Date.now();
    console.log(`[Mint] Polling started at ${new Date(start).toISOString()} for tx:`, mintTxHash);
    const poll = async () => {
      try {
        const now = Date.now();
        const response = await fetch(`${STATUS_API}/getDetailsByTxHash?txHash=${mintTxHash}`);
        const data = await response.json();
        console.log(`[Mint] Polled at ${new Date(now).toISOString()} - status:`, data.status, data.response?.[0]?.status);
        if (data.status === "SUCCESS" && data.response && data.response.length > 0) {
          setMintStatus(data.response[0]);
          if (data.response[0]?.writePayloads[0]?.executeDetails?.isExecuted) {
            setError('Mint successful!');

            const done = Date.now();
            console.log(`[Mint] COMPLETED at ${new Date(done).toISOString()} (elapsed: ${(done-start)/1000}s)`);
            setIsPollingMintStatus(false);
            if (mintPollIntervalRef.current) clearInterval(mintPollIntervalRef.current);
            await refreshBalances();
            console.log(`[Mint] Balances refreshed at ${new Date().toISOString()}`);
          }
        }
      } catch (err) {}
    };
    poll();
    mintPollIntervalRef.current = setInterval(poll, 1000);
    return () => {
      if (mintPollIntervalRef.current) clearInterval(mintPollIntervalRef.current);
    };
  }, [mintTxHash]);

  // Mint handler
  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('No wallet');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const superToken = new ethers.Contract(superTokenAddress, ERC20_ABI, signer);
      // Assume mint(uint256) exists on superToken (if not, adjust to correct ABI/contract)
      const tx = await superToken.mint(ethers.utils.parseUnits('100', 18)); // Mint 100 tokens for demo
      await tx.wait();
      setError('Minted 100 tokens!');
    } catch (err: any) {
      setError(err.message || 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  // Permit handler
  const handleSignPermit = async () => {
    setIsSigning(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('No wallet');
      // Switch to Arbitrum Sepolia (chainId 0x66eee) for permit signing
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x66eee' }],
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const superToken = new ethers.Contract(superTokenAddress, ERC20_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const value = ethers.utils.parseUnits(amount, 18);
      const sig = await createPermitSignature(
        superToken,
        userAddress,
        vaultAddress,
        value,
        deadline,
        signer
      );
      setPermitSig({ ...sig, deadline });
    } catch (err: any) {
      setError(err.message || 'Permit signing failed');
    } finally {
      setIsSigning(false);
    }
  };

  // Deposit handler
  const handleDeposit = async () => {
    setIsDepositing(true);
    setError(null);
    setDepositTxHash(null);
    setDepositStatus(null);
    try {
      if (!window.ethereum || !permitSig) throw new Error('No wallet or permit');
      // Switch to EVMX network (chainId 0x2b)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2b' }],
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const appGateway = getAppGatewayContractWithSigner(signer);
      const value = ethers.utils.parseUnits(amount, 18);
      const order = {
        chainSlug: CHAIN_SLUG_SUPERTOKEN,
        token: superTokenAddress,
        user: userAddress,
        amount: value,
        deadline: permitSig.deadline,
        v: permitSig.v,
        r: permitSig.r,
        s: permitSig.s,
      };
      const sent = Date.now();
      console.log(`[Deposit] Sending tx at ${new Date(sent).toISOString()}`);
      const tx = await appGateway.depositWithPermit(order);
      setDepositTxHash(tx.hash);
      console.log(`[Deposit] Tx sent at ${new Date().toISOString()} hash:`, tx.hash);
      // await tx.wait();
      const mined = Date.now();
      console.log(`[Deposit] Tx mined at ${new Date(mined).toISOString()} (elapsed: ${(mined-sent)/1000}s)`);
      setError('Deposit successful!');
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  // Mint handler for Mint tab
  const handleMintTab = async () => {
    setIsMintingTx(true);
    setMintTxHash(null);
    setMintStatus(null);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('No wallet');
      if (!mintChain || !mintAmount) throw new Error('Select chain and amount');
      // Switch to EVMX network (chainId 0x2b)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2b' }],
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const appGateway = getAppGatewayContractWithSigner(signer);
      const value = ethers.utils.parseUnits(mintAmount, 18);
      const sent = Date.now();
      console.log(`[Mint] Sending tx at ${new Date(sent).toISOString()}`);
      const tx = await appGateway.mint(mintChain, value);
      setMintTxHash(tx.hash);
      console.log(`[Mint] Tx sent at ${new Date().toISOString()} hash:`, tx.hash);
      // await tx.wait();
      const mined = Date.now();
      console.log(`[Mint] Tx mined at ${new Date(mined).toISOString()} (elapsed: ${(mined-sent)/1000}s)`);
    } catch (err: any) {
      setError(err.message || 'Mint failed');
    } finally {
      setIsMintingTx(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-lg p-6 mt-8 text-gray-100">
      <div className="flex mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ${tab === 'deposit' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => setTab('deposit')}
        >Deposit</button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none ml-2 ${tab === 'mint' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => setTab('mint')}
        >Mint</button>
      </div>
      {tab === 'deposit' && (
        <div className="space-y-6">
          <div className="text-sm text-gray-300 mb-2">SuperToken Balance: <span className="font-mono">{balance}</span></div>
          {balance === '0' ? (
            <button
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-colors"
              onClick={handleMint}
              disabled={isMinting}
            >
              {isMinting ? 'Minting...' : 'Mint SuperToken'}
            </button>
          ) : (
            <>
              <div>
                <label className="block text-gray-400 mb-1">Amount to Deposit</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSignPermit}
                  disabled={isSigning || !amount || Number(amount) <= 0}
                >
                  {isSigning ? 'Signing...' : 'Sign Permit'}
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  onClick={handleDeposit}
                  disabled={isDepositing || !permitSig || !amount || Number(amount) <= 0}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </button>
              </div>
              {permitSig && (
                <div className="text-xs text-green-400 mt-2">Permit signature ready!</div>
              )}
            </>
          )}
          {/* Deposit status and tx hashes, only in deposit tab */}
          {depositTxHash && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
              <div className="mb-2">
                <span className="font-medium text-gray-200">Deposit Tx:</span>
                <a
                  href={`${EVMX_EXPLORER}/tx/${depositTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary underline font-mono text-xs"
                >
                  {depositTxHash.slice(0, 10)}...{depositTxHash.slice(-6)}
                </a>
              </div>
              {isPollingStatus && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Checking deposit status...</span>
                </div>
              )}
              {depositStatus && (
                <div className="mt-2 text-sm">
                  {/* <span className="font-medium">Status:</span> {depositStatus.status} */}
                  {depositStatus.writePayloads && depositStatus.writePayloads.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">Execute Tx:</span>{' '}
                      {depositStatus.writePayloads[0].executeDetails.executeTxHash ? (
                        (() => {
                          const chainSlug = depositStatus.writePayloads[0].chainSlug;
                          const explorer = CHAIN_INFO[chainSlug]?.explorerUrl || EVMX_EXPLORER;
                          return (
                            <a
                              href={`${explorer}/tx/${depositStatus.writePayloads[0].executeDetails.executeTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline font-mono text-xs"
                            >
                              {depositStatus.writePayloads[0].executeDetails.executeTxHash.slice(0, 10)}...{depositStatus.writePayloads[0].executeDetails.executeTxHash.slice(-6)}
                            </a>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {tab === 'mint' && (
        <div className="space-y-6">
          <div className="mb-2">
            <label className="block text-gray-400 mb-1">Select Chain</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              value={mintChain || ''}
              onChange={e => setMintChain(Number(e.target.value))}
            >
              <option value="" disabled>Select chain</option>
              {SUPPORTED_CHAINS
                .filter(chain => typeof chain === 'number' && chain !== CHAIN_SLUG_SUPERTOKEN)
                .map(chain => (
                  <option key={chain} value={chain}>
                    {CHAIN_INFO[chain]?.name || chain}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Amount to Mint</label>
            <input
              type="number"
              min="0"
              max={maxMintable}
              value={mintAmount}
              onChange={e => setMintAmount(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={`Max: ${maxMintable}`}
            />
            <div className="text-xs text-gray-400 mt-1">Max: {maxMintable}</div>
          </div>
          <button
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-colors"
            onClick={handleMintTab}
            disabled={isMintingTx || !mintChain || !mintAmount || Number(mintAmount) <= 0 || Number(mintAmount) > maxMintable}
          >
            {isMintingTx ? 'Minting...' : 'Mint'}
          </button>
          {/* Mint status and tx hashes, only in mint tab */}
          {mintTxHash && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
              <div className="mb-2">
                <span className="font-medium text-gray-200">Mint Tx:</span>
                <a
                  href={`${EVMX_EXPLORER}/tx/${mintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary underline font-mono text-xs"
                >
                  {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-6)}
                </a>
              </div>
              {isPollingMintStatus && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Checking mint status...</span>
                </div>
              )}
              {mintStatus && (
                <div className="mt-2 text-sm">
                  {/* <span className="font-medium">Status:</span> {mintStatus.status} */}
                  {mintStatus.writePayloads && mintStatus.writePayloads.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">Execute Tx:</span>{' '}
                      {mintStatus.writePayloads[0].executeDetails.executeTxHash ? (
                        (() => {
                          const chainSlug = mintStatus.writePayloads[0].chainSlug;
                          const explorer = CHAIN_INFO[chainSlug]?.explorerUrl || EVMX_EXPLORER;
                          return (
                            <a
                              href={`${explorer}/tx/${mintStatus.writePayloads[0].executeDetails.executeTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline font-mono text-xs"
                            >
                              {mintStatus.writePayloads[0].executeDetails.executeTxHash.slice(0, 10)}...{mintStatus.writePayloads[0].executeDetails.executeTxHash.slice(-6)}
                            </a>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <div className={`${error === 'Deposit successful!' || error === 'Mint successful!' ? 'bg-green-900 border-green-700' : 'bg-red-900 border-red-700'} border rounded-lg p-4 mt-4`}>
          <p className={`${error === 'Deposit successful!' || error === 'Mint successful!' ? 'text-green-300' : 'text-red-300'} text-sm`}>{error}</p>
        </div>
      )}
    </div>
  );
} 