import { Chain } from "@/types";
import { ethers } from "ethers";


export enum CHAIN_SLUGS {
    EVMX = 43,
    ARBITRUM_SEPOLIA = 421614,
    OPTIMISM_SEPOLIA = 11155420,
    BASE_SEPOLIA = 84532,
  }

  export const SUPPORTED_CHAINS: CHAIN_SLUGS[] = [
    CHAIN_SLUGS.ARBITRUM_SEPOLIA,
    CHAIN_SLUGS.OPTIMISM_SEPOLIA
  ]
  
  export const CCTP_DOMAINS: {
    [chainSlug: number]: number;
  } = {
    [CHAIN_SLUGS.ARBITRUM_SEPOLIA]: 3,
    [CHAIN_SLUGS.OPTIMISM_SEPOLIA]: 2,
    [CHAIN_SLUGS.BASE_SEPOLIA]: 6,
  };

  
  export const CHAIN_INFO: {
    [chainSlug: number]: Chain;
  } = {
    [CHAIN_SLUGS.ARBITRUM_SEPOLIA]: {
      id: CHAIN_SLUGS.ARBITRUM_SEPOLIA  ,
      name: 'Arbitrum Sepolia',
      rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      explorerUrl: 'https://sepolia.arbiscan.io/',
    },
    [CHAIN_SLUGS.OPTIMISM_SEPOLIA]: {
      id: CHAIN_SLUGS.OPTIMISM_SEPOLIA,
      name: 'Optimism Sepolia',
      rpc: 'https://sepolia.optimism.io',
      chainId: 11155420,
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      explorerUrl: 'https://sepolia-optimism.etherscan.io/',
    },
    [CHAIN_SLUGS.BASE_SEPOLIA]: {
      id: CHAIN_SLUGS.BASE_SEPOLIA,
      name: 'Base Sepolia',
      rpc: 'https://sepolia.base.org',
      chainId: 84532,
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      explorerUrl: 'https://sepolia.basescan.org/',
    },
    [CHAIN_SLUGS.EVMX]: {
      id: CHAIN_SLUGS.EVMX,
      name: 'Dev EVMX',
      rpc: process.env.NEXT_PUBLIC_EVMX_RPC!,
      chainId: 43,
      nativeCurrency: {
        name: 'EVMX',
        symbol: 'EVMX',
        decimals: 18
      },
      explorerUrl: 'https://evmx.cloud.blockscout.com/',
      appGateway: process.env.NEXT_PUBLIC_APP_GATEWAY_ADDRESS!
    }
  };
  
  
  export const getProviders = () => ({
    [CHAIN_SLUGS.EVMX]: new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUGS.EVMX].rpc),
    [CHAIN_SLUGS.ARBITRUM_SEPOLIA]: new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUGS.ARBITRUM_SEPOLIA].rpc),
    [CHAIN_SLUGS.OPTIMISM_SEPOLIA]: new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUGS.OPTIMISM_SEPOLIA].rpc),
    [CHAIN_SLUGS.BASE_SEPOLIA]: new ethers.providers.JsonRpcProvider(CHAIN_INFO[CHAIN_SLUGS.BASE_SEPOLIA].rpc),
  });

  export const providers = getProviders();