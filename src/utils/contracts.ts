import { ethers } from 'ethers';
import { APP_GATEWAY_ABI, CHAIN_INFO } from '@/constants';
import { getProviders, CHAIN_SLUGS } from '@/constants';

export async function getOnChainAddress(
  contractId: string,
  chainId: number
): Promise<string> {
  return getAppGatewayContract().getOnChainAddress(contractId, chainId);
} 

export const getAppGatewayContract = () => {
  const providers = getProviders();
  const provider = providers[CHAIN_SLUGS.EVMX];
  const appGatewayAddress = CHAIN_INFO[CHAIN_SLUGS.EVMX].appGateway;
  if (!appGatewayAddress) throw new Error('App gateway address not set for EVMX');
  return new ethers.Contract(appGatewayAddress, APP_GATEWAY_ABI, provider);
}

export const getAppGatewayContractWithSigner = (signer: ethers.Signer) => {
  const appGatewayAddress = CHAIN_INFO[CHAIN_SLUGS.EVMX].appGateway;
  if (!appGatewayAddress) throw new Error('App gateway address not set for EVMX');
  return new ethers.Contract(appGatewayAddress, APP_GATEWAY_ABI, signer);
}