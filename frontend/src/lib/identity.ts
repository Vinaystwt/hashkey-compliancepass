import { Identity } from "@semaphore-protocol/identity";

const STORAGE_KEY = "compliancepass_identity";

export function getIdentityMessage(chainId: number, address: string) {
  return `HashKey CompliancePass Identity v1 — ${chainId} — ${address.toLowerCase()}`;
}

export function getOrCreateIdentity(address: string, signature: string) {
  const key = `${STORAGE_KEY}_${address.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return Identity.import(stored);
  }
  const identity = new Identity(signature);
  localStorage.setItem(key, identity.export());
  return identity;
}
