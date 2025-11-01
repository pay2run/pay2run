import type { Address } from "viem";
import type { Chain } from "viem/chains";

/**
 * Solana cluster/network configuration
 */
export type SolanaCluster = "mainnet-beta" | "testnet" | "devnet" | string;

/**
 * Solana token configuration using SPL token standard
 */
export interface SolanaToken {
  /** Token symbol (e.g., 'USDC', 'SOL', 'BONK') */
  symbol: string;
  /** SPL token mint address (omit for native SOL) */
  mint?: string;
  /** Number of decimals for the token */
  decimals: number;
  /** Human-readable token name */
  name: string;
}

/**
 * ERC-20 token configuration for EVM chains
 */
export interface ERC20Token {
  /** Token symbol (e.g., 'USDC', 'ETH', 'WETH') */
  symbol: string;
  /** ERC-20 token contract address (omit for native tokens like ETH) */
  address?: Address;
  /** Number of decimals for the token */
  decimals: number;
  /** Human-readable token name */
  name: string;
}

/**
 * Payment configuration for EVM-compatible chains (Ethereum, Base, Polygon, etc.)
 * Uses viem's Chain type for type safety and compatibility
 */
export interface EVMPaymentConfig {
  type: "evm";
  /** The EVM chain to use (from viem/chains) */
  chain: Chain;
  /** The ERC-20 token to accept for payment */
  token: ERC20Token;
  /** The destination wallet address for receiving payments */
  destinationAddress: Address;
}

/**
 * Payment configuration for Solana network
 * Uses Solana's PublicKey type for addresses
 */
export interface SolanaPaymentConfig {
  type: "solana";
  /** Solana cluster */
  cluster: SolanaCluster;
  /** The SPL token to accept for payment */
  token: SolanaToken;
  /** The destination wallet address for receiving payments (base58 encoded PublicKey) */
  destinationAddress: string;
}

/**
 * Creator payment configuration supporting multiple blockchain networks
 */
export type CreatorPaymentConfig = EVMPaymentConfig | SolanaPaymentConfig;

/**
 * The payload used by a creator to configure an Action. This is the INPUT to the API
 * and contains sensitive data.
 */
export interface ActionConfigPayload {
  name: string;
  description?: string;
  targetUrl: string;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  secrets: Record<string, string>;
  price: string;
  currency: string;
  payment: CreatorPaymentConfig;
}

/**
 * Solana Pay payment method details
 * @see https://docs.solanapay.com/
 */
export interface SolanaPayMethodDetails {
  type: "solanaPay";
  /** Solana Pay transfer request URL */
  paymentUrl: string;
  /** Human-readable label for the payment */
  label: string;
  /** Optional icon URL */
  icon?: string;
  /** Solana cluster */
  cluster: SolanaCluster;
}

/**
 * EIP-681 payment request for EVM chains
 * @see https://eips.ethereum.org/EIPS/eip-681
 */
export interface EIP681PaymentMethodDetails {
  type: "eip681";
  /** EIP-681 payment request URI (e.g., ethereum:0x...@1/transfer?address=0x...&uint256=...) */
  paymentUri: string;
  /** Human-readable label for the payment */
  label: string;
  /** Optional icon URL */
  icon?: string;
  /** EVM chain ID */
  chainId: number;
}

/**
 * Generic payment method for other protocols
 */
export interface GenericPaymentMethodDetails {
  type: string;
  /** Payment URI or URL */
  paymentUri: string;
  /** Human-readable label for the payment */
  label: string;
  /** Optional icon URL */
  icon?: string;
  /** Optional chain/network identifier */
  network?: string;
}

/**
 * Payment method details for different blockchain protocols
 */
export type PaymentMethodDetails =
  | SolanaPayMethodDetails
  | EIP681PaymentMethodDetails
  | GenericPaymentMethodDetails;

/** The generic payment information returned by the API in a 402 response. */
export interface PaymentRequestDetails {
  paymentRequestId: string;
  method: PaymentMethodDetails;
}

/**
 * Public payment configuration for EVM chains
 */
export interface EVMPaymentInfo {
  type: "evm";
  price: string;
  currency: string;
  /** The EVM chain configuration (from viem) */
  chain: Chain;
  /** ERC-20 token details */
  token: {
    symbol: string;
    address?: Address;
    decimals: number;
  };
}

/**
 * Public payment configuration for Solana
 */
export interface SolanaPaymentInfo {
  type: "solana";
  price: string;
  currency: string;
  /** Solana cluster */
  cluster: SolanaCluster;
  /** SPL token details */
  token: {
    symbol: string;
    mint?: string;
    decimals: number;
  };
}

/**
 * Public payment information returned by the API
 */
export type ActionPaymentInfo = EVMPaymentInfo | SolanaPaymentInfo;

/**
 * Represents the public-facing, shareable details of a pay2.run Action.
 * This is the OUTPUT from the API and is safe to expose in a frontend application.
 */
export interface ActionConfig {
  id: string;
  name: string;
  description?: string;
  payment: ActionPaymentInfo;
}

/** The options a user can provide when running an Action. */
export interface RunActionOptions {
  body?: any;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}
