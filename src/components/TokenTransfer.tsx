"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Chain, TokenInfo, DeployedContracts } from "@/types";
import {
	ERC20_ABI,
	APP_GATEWAY_ABI,
	CHAIN_INFO,
	SUPPORTED_CHAINS,
	VAULT_CONTRACT_ID,
	SUPER_TOKEN_CONTRACT_ID,
	getProviders,
	CHAIN_SLUGS,
	CCTP_DOMAINS,
} from "@/constants";
import { getOnChainAddress } from "@/utils/contracts";
import { createPermitSignature } from "@/utils/permit";
import { STATUS_API } from "@/constants/api";

interface TokenTransferProps {
	tokenInfo: TokenInfo;
	selectedChain: Chain;
	deployedContracts: DeployedContracts;
	destinationChains?: Chain[];
	onDeployContracts: (chainSlugs: number[]) => Promise<void>;
}

export default function TokenTransfer({
	tokenInfo,
	selectedChain: initialSelectedChain,
	deployedContracts,
	destinationChains = [],
	onDeployContracts,
}: TokenTransferProps) {
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [selectedChain, setSelectedChain] =
		useState<Chain>(initialSelectedChain || CHAIN_INFO[CHAIN_SLUGS.ARBITRUM_SEPOLIA]);
	const [selectedDestinationChain, setSelectedDestinationChain] =
		useState<Chain | null>(null);
	const [amount, setAmount] = useState("");
	const [isSigningPermit, setIsSigningPermit] = useState(false);
	const [isTransferring, setIsTransferring] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [txHash, setTxHash] = useState<string | null>(null);
	const [balance, setBalance] = useState<string>("0");
	const [isCheckingContracts, setIsCheckingContracts] = useState(false);
	const [permitSignature, setPermitSignature] = useState<{ v: number; r: string; s: string, deadline: number } | null>(null);
	const [transferTxHash, setTransferTxHash] = useState<string | null>(null);
	const [transferStatus, setTransferStatus] = useState<any>(null);
	const [isPollingStatus, setIsPollingStatus] = useState(false);

	// Get available destination chains (all supported chains except the selected source chain)
	const availableDestinationChains = SUPPORTED_CHAINS
		.filter(chainSlug => chainSlug !== selectedChain.id)
		.map(chainSlug => CHAIN_INFO[chainSlug]);

	// Reset destination chain when source chain changes
	useEffect(() => {
		setSelectedDestinationChain(null);
		setPermitSignature(null);
	}, [selectedChain]);

	// Create providers for read operations
	const providers = getProviders();
	const sourceProvider = providers[selectedChain.id as keyof typeof providers];
	const destinationProvider =
		selectedDestinationChain &&
		providers[selectedDestinationChain.id as keyof typeof providers];

	useEffect(() => {
		checkWalletConnection();
	}, []);

	useEffect(() => {
		const fetchBalance = async () => {
			if (!window.ethereum || !selectedChain || !tokenInfo) {
				console.error("Missing required parameters", selectedChain, tokenInfo);
				return;
			}

			try {
				const provider = new ethers.providers.Web3Provider(window.ethereum);
				const accounts = await provider.listAccounts();
				const address = accounts[0];

				// Determine if we're on the source chain (token's native chain) or destination chain
				const isSourceChain = selectedChain.id === tokenInfo.chainId;
				
				let tokenAddress: string;

				if (isSourceChain) {
					// If we're on the source chain, check balance of the original token
					tokenAddress = tokenInfo.address;
				} else {
					// If we're on a destination chain, check balance of the super token
					tokenAddress = await getOnChainAddress(
						SUPER_TOKEN_CONTRACT_ID,
						selectedChain.id
					);
				}

				if (tokenAddress === ethers.constants.AddressZero) {
					setBalance("0");
					return;
				}

				// Get balance using the chain's provider
				const chainTokenContract = new ethers.Contract(
					tokenAddress,
					ERC20_ABI,
					sourceProvider
				);
				const balance = await chainTokenContract.balanceOf(address);
				setBalance(Number(ethers.utils.formatUnits(balance, tokenInfo.decimals)).toFixed(2));
			} catch (err) {
				console.error("Error fetching balance:", err);
				setBalance("0");
			}
		};

		fetchBalance();
	}, [selectedChain, tokenInfo]);

	// Reset permit signature when amount changes
	useEffect(() => {
		setPermitSignature(null);
	}, [amount]);

	// Function to determine why transfer button is disabled
	const getTransferButtonError = () => {
		if (isTransferring) return "Transfer in progress...";
		if (!isWalletConnected) return "Please connect your wallet";
		if (!amount) return "Please enter an amount";
		if (Number(amount) <= 0) return "Amount must be greater than 0";
		if (Number(amount) > Number(balance)) return "Insufficient balance";
		if (!permitSignature) return "Please sign permit first";
		if (!selectedChain) return "Please select a source chain";
		if (!selectedDestinationChain) return "Please select a destination chain";
		if (!tokenInfo) return "Token information not available";
		if (!deployedContracts) return "Contracts not deployed";
		if (isPollingStatus) return "Checking transfer status...";
		return null; // Button should be enabled
	};

	const isTransferButtonDisabled = () => {
		return getTransferButtonError() !== null;
	};

	const handlePermit = async () => {
		if (!window.ethereum || !selectedChain || !tokenInfo || !selectedDestinationChain) return;

		setIsSigningPermit(true);
		setError(null);
		setPermitSignature(null);

		try {
			// Use the provider from chains.ts to read data (no network switch needed)
			const providers = getProviders();
			const sourceProvider = providers[selectedChain.id as keyof typeof providers];
			const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
			const accounts = await walletProvider.listAccounts();
			const userAddress = accounts[0];

			// Determine if we're on the source chain (token's native chain) or destination chain
			const isSourceChain = selectedChain.id === tokenInfo.chainId;
			
			let tokenAddress: string;
			let spenderAddress: string;

			if (isSourceChain) {
				// If we're on the source chain, permit the vault to spend our tokens
				tokenAddress = tokenInfo.address;
				spenderAddress = await getOnChainAddress(
					VAULT_CONTRACT_ID,
					selectedChain.id
				);
			} else {
				// If we're on a destination chain, permit the super token contract to burn our tokens
				tokenAddress = await getOnChainAddress(
					SUPER_TOKEN_CONTRACT_ID,
					selectedChain.id
				);
				spenderAddress = tokenAddress; // Super token contract burns its own tokens
			}

			if (tokenAddress === ethers.constants.AddressZero) {
				throw new Error(`Token not deployed on ${selectedChain.name}`);
			}

			if (spenderAddress === ethers.constants.AddressZero) {
				throw new Error(`Spender contract not deployed on ${selectedChain.name}`);
			}

			// Create token contract instance using the selected chain provider
			const tokenContract = new ethers.Contract(
				tokenAddress,
				ERC20_ABI,
				sourceProvider
			);

			// Create permit signature using the selected chain provider for reading
			const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
			const value = ethers.utils.parseUnits(amount, tokenInfo.decimals);

			// Now switch to selected chain for signing
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: `0x${selectedChain.id.toString(16)}` }],
			});

			const signer = await new ethers.providers.Web3Provider(window.ethereum).getSigner();

			const { v, r, s } = await createPermitSignature(
				tokenContract,
				userAddress,
				spenderAddress,
				value,
				deadline,
				signer
			);

			setPermitSignature({ v, r, s, deadline });	
			console.log('Permit signature created:', { v, r, s, tokenAddress, spenderAddress });
		} catch (err: any) {
			console.error('Error signing permit:', err);
			setError(err.message || 'Failed to sign permit');
		} finally {
			setIsSigningPermit(false);
		}
	};

	const checkWalletConnection = async () => {
		if (typeof window !== "undefined" && window.ethereum) {
			try {
				const provider = new ethers.providers.Web3Provider(window.ethereum);
				const accounts = await provider.listAccounts();
				setIsWalletConnected(accounts.length > 0);
			} catch (err) {
				console.error("Error checking wallet connection:", err);
			}
		}
	};

	const connectWallet = async () => {
		try {
			if (!window.ethereum) {
				throw new Error("Please install MetaMask");
			}

			const accounts = await window.ethereum.request({
				method: "eth_requestAccounts",
			});

			if (accounts.length > 0) {
				setIsWalletConnected(true);
				setError(null);
			}
		} catch (err) {
			console.error("Error connecting wallet:", err);
			setError("Failed to connect wallet");
		}
	};

	const handleTransfer = async () => {
		if (
			!selectedChain ||
			!selectedDestinationChain ||
			!amount ||
			!tokenInfo ||
			!deployedContracts ||
			!permitSignature
		) {
			console.error("Missing required parameters", selectedChain, selectedDestinationChain, amount, tokenInfo, deployedContracts, permitSignature);
			return;
		}
		if (!window.ethereum) {
			setError("MetaMask is not installed");
			return;
		}

		setIsTransferring(true);
		setError(null);
		setTransferTxHash(null);
		setTransferStatus(null);

		try {
			console.log('selectedChain', selectedChain);
			console.log('selectedDestinationChain', selectedDestinationChain);
			console.log('src domain', CCTP_DOMAINS[selectedChain.id]);
			console.log('dst domain', CCTP_DOMAINS[selectedDestinationChain.id]);
			
			// Switch to EVMX chain for transfer
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: `0x${CHAIN_INFO[CHAIN_SLUGS.EVMX].id.toString(16)}` }],
			});

			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = await provider.getSigner();
			const accounts = await provider.listAccounts();
			const userAddress = accounts[0];

			// Get app gateway contract
			const appGateway = new ethers.Contract(
				CHAIN_INFO[CHAIN_SLUGS.EVMX].appGateway!,
				APP_GATEWAY_ABI,
				signer
			);

			// Determine source and destination tokens
			let srcToken: string;
			let dstToken: string;

			if (selectedChain.id === tokenInfo.chainId) {
				// If source chain is token's chain, use deployed token
				srcToken = tokenInfo.address;
				// Get forwarder address for destination chain
				dstToken = await appGateway.forwarderAddresses(
					SUPER_TOKEN_CONTRACT_ID,
					selectedDestinationChain.id
				);
			} else {
				// If source chain is not token's chain, use forwarder address
				srcToken = await appGateway.forwarderAddresses(
					SUPER_TOKEN_CONTRACT_ID,
					selectedChain.id
				);
				// Use deployed token for destination chain
				dstToken = tokenInfo.address;
			}
			// Create transfer order
			const transferOrder = {
				srcChainSlug: selectedChain.id,
				dstChainSlug: selectedDestinationChain.id,
				srcToken,
				dstToken,
				user: userAddress,
				srcAmount: ethers.utils.parseUnits(amount, tokenInfo.decimals),
			};

			// Create PermitTransferOrder with permit data
			const permitTransferOrder = {
				...transferOrder,
				deadline: permitSignature.deadline,
				v: permitSignature.v,
				r: permitSignature.r,
				s: permitSignature.s
			};

			console.log("permitTransferOrder", permitTransferOrder);
			
			// Send transferWithPermit transaction - pass struct directly
			const tx = await appGateway.transferWithPermit(permitTransferOrder);
			const txHash = tx.hash; // Capture the transaction hash
			console.log("txHash", txHash);
			setTransferTxHash(txHash);
			await tx.wait();

			// Start polling for transfer status
			setIsPollingStatus(true);
			const pollInterval = setInterval(async () => {
				try {
					console.log(STATUS_API, txHash);
					const response = await fetch(`${STATUS_API}/getDetailsByTxHash?txHash=${txHash}`);
					const data = await response.json();
					
					if (data.status === "SUCCESS" && data.response && data.response.length > 0) {
						const transferData = data.response[0];
						setTransferStatus(transferData);
						
						// Stop polling if status is COMPLETED
						if (transferData.status === "COMPLETED") {
							clearInterval(pollInterval);
							setIsPollingStatus(false);
						}
					}
				} catch (err) {
					console.error('Error polling transfer status:', err);
				}
			}, 5000); // Poll every 5 seconds

			// Clear interval after 10 minutes (timeout)
			setTimeout(() => {
				clearInterval(pollInterval);
				if (isPollingStatus) {
					setIsPollingStatus(false);
					setError('Transfer status polling timeout');
				}
			}, 10 * 60 * 1000);

		} catch (err: any) {
			console.error('Error transferring token:', err);
			setError(err.message || 'Failed to transfer token');
		} finally {
			setIsTransferring(false);
		}
	};

	return (
		<div className="space-y-6">
			{!isWalletConnected ? (
				<div className="text-center">
					<button
						onClick={connectWallet}
						className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
					>
						Connect Wallet
					</button>
				</div>
			) : (
				<>
					{/* Source Chain Selection */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Source Chain</h3>
							{selectedChain && (
								<div className="text-sm text-gray-600">
									Selected: <span className="font-medium">{selectedChain.name}</span>
								</div>
							)}
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{SUPPORTED_CHAINS.map((chain) => (
								<div
									key={chain}
									onClick={() => setSelectedChain(CHAIN_INFO[chain])}
									className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
										selectedChain.id === chain
											? 'border-primary bg-primary/5'
											: 'border-gray-200 hover:border-gray-300'
									}`}
								>
									<div className="font-medium text-gray-900">
										{CHAIN_INFO[chain].name}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Destination Chain Selection */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Destination Chain</h3>
							{selectedDestinationChain && (
								<div className="text-sm text-gray-600">
									Selected: <span className="font-medium">{selectedDestinationChain.name}</span>
								</div>
							)}
						</div>
						{availableDestinationChains.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								{availableDestinationChains.map((chain) => (
									<div
										key={chain.id}
										onClick={() => setSelectedDestinationChain(chain)}
										className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
											selectedDestinationChain?.id === chain.id
												? 'border-primary bg-primary/5'
												: 'border-gray-200 hover:border-gray-300'
										}`}
									>
										<div className="font-medium text-gray-900">{chain.name}</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-4 text-gray-500">
								No destination chains available. Please select a different source chain.
							</div>
						)}
					</div>

					{/* Amount Input */}
					<div className="space-y-4">
						<div>
							<div className="flex justify-between items-center mb-2 max-w-md">
								<label
									htmlFor="amount"
									className="block text-sm font-medium text-gray-700"
								>
									Amount
								</label>
								<div className="text-sm text-gray-600">
									<span className="font-medium">Balance:</span> {balance} {tokenInfo?.symbol}
								</div>
							</div>
							<div className="max-w-md">
								<input
									type="number"
									id="amount"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:ring-opacity-50 sm:text-sm px-4 py-3"
									placeholder="Enter amount"
									min="0"
									step="0.000001"
								/>
							</div>
						</div>

						{amount && (
							<div className="bg-gray-50 p-4 rounded-lg space-y-2">
								{Number(amount) > Number(balance) && (
									<p className="text-red-600 text-sm font-medium">❌ Insufficient balance</p>
								)}
							</div>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col space-y-3">
						{!permitSignature && (
							<button
								onClick={handlePermit}
								disabled={isSigningPermit || !isWalletConnected || !amount || Number(amount) <= 0 || Number(amount) > Number(balance) || !selectedDestinationChain}
								className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
							>
								{isSigningPermit ? 'Signing Permit...' : 'Sign Permit'}
							</button>
						)}

						{permitSignature && (
							<div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
								<span className="font-medium">✅ Permit Signed:</span> Ready for transfer
							</div>
						)}

						<button
							onClick={handleTransfer}
							disabled={isTransferButtonDisabled()}
							className={`w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-300 ${
								isPollingStatus ? 'opacity-50' : ''
							}`}
						>
							{isTransferring ? 'Transferring...' : 'Transfer Token'}
						</button>
						
						{/* Show why transfer button is disabled */}
						{isTransferButtonDisabled() && (
							<div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
								<span className="font-medium">⚠️ Transfer not available:</span> {getTransferButtonError()}
							</div>
						)}
					</div>

					{/* Transfer Status */}
					{transferTxHash && (
						<div className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-opacity duration-300 ${
							isPollingStatus ? 'opacity-75' : 'opacity-100'
						}`}>
							<h4 className="font-medium text-gray-900">Transfer Status</h4>
							<div className="text-sm text-gray-600">
								<span className="font-medium">Transaction:</span>{' '}
								{CHAIN_INFO[CHAIN_SLUGS.EVMX].explorerUrl ? (
									<a
										href={`${CHAIN_INFO[CHAIN_SLUGS.EVMX].explorerUrl}/tx/${transferTxHash}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										{transferTxHash}
									</a>
								) : (
									<span className="font-mono">{transferTxHash}</span>
								)}
							</div>

							{isPollingStatus && (
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
									<span>Checking transfer status...</span>
								</div>
							)}

							{transferStatus && (
								<div className="space-y-3">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-900">Status:</span>
										<span className={`text-sm px-2 py-1 rounded-full ${
											transferStatus.status === 'COMPLETED' 
												? 'bg-green-100 text-green-800' 
												: 'bg-yellow-100 text-yellow-800'
										}`}>
											{transferStatus.status}
										</span>
									</div>

									{transferStatus.writePayloads && transferStatus.writePayloads.length > 0 && (
										<div className="overflow-x-auto">
											<table className="min-w-full divide-y divide-gray-200">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Chain
														</th>
														<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Status
														</th>
														<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															Transaction
														</th>
														<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
															CCTP
														</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{transferStatus.writePayloads.map((payload: any, index: number) => (
														<tr key={index}>
															<td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
																{CHAIN_INFO[payload.chainSlug]?.name || `Chain ${payload.chainSlug}`}
															</td>
															<td className="px-3 py-2 whitespace-nowrap">
																<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
																	payload.executeDetails.isExecuted
																		? 'bg-green-100 text-green-800'
																		: 'bg-yellow-100 text-yellow-800'
																}`}>
																	{payload.executeDetails.isExecuted ? 'Executed' : 'Pending'}
																</span>
															</td>
															<td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
																{payload.executeDetails.executeTxHash ? (
																	CHAIN_INFO[payload.chainSlug]?.explorerUrl ? (
																		<a
																			href={`${CHAIN_INFO[payload.chainSlug].explorerUrl}/tx/${payload.executeDetails.executeTxHash}`}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-primary hover:underline font-mono text-xs"
																		>
																			{payload.executeDetails.executeTxHash.slice(0, 10)}...
																		</a>
																	) : (
																		<span className="font-mono text-xs">
																			{payload.executeDetails.executeTxHash.slice(0, 10)}...
																		</span>
																	)
																) : (
																	<span className="text-gray-400">-</span>
																)}
															</td>
															<td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
																{/* {index === 0 && payload.executeDetails.isExecuted && payload.executeDetails.executeTxHash ? (
																	<a
																		href={`${process.env.NEXT_PUBLIC_DEV_CCTP_API_URL}/${CCTP_DOMAINS[selectedChain.id]}?transactionHash=${payload.executeDetails.executeTxHash}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-primary hover:underline text-xs"
																	>
																		 CCTP Attestations
																	</a>
																) : (
																	<span className="text-gray-400">-</span>
																)} */}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</>
			)}

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-600 text-sm">{error}</p>
				</div>
			)}
		</div>
	);
}
