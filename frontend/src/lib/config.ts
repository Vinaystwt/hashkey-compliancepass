import type { Chain } from "viem";
import deployedAddresses from "@/lib/deployedAddresses.json";

export const ORACLE_API_URL =
  import.meta.env.VITE_ORACLE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:3001");
export const ORACLE_DISPLAY_URL = ORACLE_API_URL || "/api";

export const localChain: Chain = {
  id: 31337,
  name: "Local Sandbox",
  nativeCurrency: {
    decimals: 18,
    name: "HSK",
    symbol: "HSK",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: {
      name: "Local Explorer",
      url: "http://127.0.0.1:8545",
    },
  },
  testnet: true,
};

export const hashKeyTestnet: Chain = {
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HSK",
    symbol: "HSK",
  },
  rpcUrls: {
    default: { http: ["https://testnet.hsk.xyz"] },
    public: { http: ["https://testnet.hsk.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: "https://testnet-explorer.hsk.xyz",
    },
  },
  testnet: true,
};

export const activeChain = deployedAddresses.chainId === 133 ? hashKeyTestnet : localChain;

export const appConfig = {
  appName: "HashKey CompliancePass",
  activeChain,
  oracleApiUrl: ORACLE_API_URL,
  networkLabel: deployedAddresses.chainId === 133 ? "HashKey Testnet" : "Local Sandbox",
  networkMode: deployedAddresses.chainId === 133 ? "testnet" : "local",
};

export const credentialCatalog = [
  {
    id: 0,
    name: "Age 18+",
    summary: "Basic age verification for open access products.",
    unlocks: "Tier 1 access surfaces",
  },
  {
    id: 1,
    name: "Permitted Jurisdiction",
    summary: "Jurisdiction eligibility for compliant market access.",
    unlocks: "Tier 1 and Tier 2 combinations",
  },
  {
    id: 2,
    name: "Accredited Investor",
    summary: "Institutional-grade access for higher-bar products.",
    unlocks: "Tier 3 products",
  },
  {
    id: 3,
    name: "KYC Level 1",
    summary: "Standard identity verification.",
    unlocks: "Tier 2 products",
  },
  {
    id: 4,
    name: "KYC Level 2",
    summary: "Enhanced due diligence with the strongest access posture.",
    unlocks: "Tier 3 products",
  },
] as const;
