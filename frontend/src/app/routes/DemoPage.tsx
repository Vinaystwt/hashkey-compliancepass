import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { CheckCircle, LockSimple, Robot, ShieldWarning } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierBadge } from "@/components/ui/TierBadge";
import { MetricStat } from "@/components/ui/MetricStat";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { canParticipate, getProtocolRequirements } from "@/lib/complianceAgent";
import { protocolAddressForKey, abis, publicClient } from "@/lib/onchain";
import { shortAddress } from "@/lib/utils";

const products = [
  {
    key: "bond" as const,
    title: "Government Bond Fund",
    subline: "Tokenized sovereign debt, restricted to the highest access tier.",
    metric: "4.50% APY",
    cta: "Deposit 0.1 HSK",
  },
  {
    key: "stablecoin" as const,
    title: "Stablecoin Mint",
    subline: "Institutional issuance for compliant reserve participants.",
    metric: "Mint HKUSD",
    cta: "Mint 1,000 units",
  },
  {
    key: "credit" as const,
    title: "Credit Facility",
    subline: "AI-aware underwriting for wallets below the risk threshold.",
    metric: "Risk ≤ 50",
    cta: "Apply for 5,000 credit",
  },
];

export function DemoPage() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [activeExecution, setActiveExecution] = useState<"bond" | "stablecoin" | "credit" | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const protocolState = useQuery({
    queryKey: ["protocol-state", address],
    queryFn: async () => {
      if (!address) return null;
      const resolved = await Promise.all(
        products.map(async (product) => {
          const protocolAddress = protocolAddressForKey(product.key);
          const [eligibility, requirements] = await Promise.all([
            canParticipate(address, protocolAddress),
            getProtocolRequirements(protocolAddress),
          ]);
          return { ...product, protocolAddress, eligibility, requirements };
        })
      );
      return resolved;
    },
    enabled: Boolean(address),
  });

  const unlockedCount = useMemo(
    () => protocolState.data?.filter((entry) => entry.eligibility.allowed).length ?? 0,
    [protocolState.data]
  );

  async function executeProtocol(key: "bond" | "stablecoin" | "credit") {
    if (!address) return;
    setExecutionError(null);
    setActiveExecution(key);
    const protocolAddress = protocolAddressForKey(key);
    try {
      if (key === "bond") {
        const hash = await writeContractAsync({
          address: protocolAddress,
          abi: abis.mockBond,
          functionName: "deposit",
          value: BigInt(1e17),
        });
        await publicClient.waitForTransactionReceipt({ hash });
        return;
      }
      if (key === "stablecoin") {
        const hash = await writeContractAsync({
          address: protocolAddress,
          abi: abis.mockStablecoin,
          functionName: "mintStablecoin",
          args: [1000n],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        return;
      }
      const hash = await writeContractAsync({
        address: protocolAddress,
        abi: abis.mockCredit,
        functionName: "applyForCredit",
        args: [5000n],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (caught) {
      setExecutionError(caught instanceof Error ? caught.message : "Protocol transaction failed.");
    } finally {
      setActiveExecution(null);
    }
  }

  return (
    <div className="page-frame">
      <SectionHeader
        eyebrow="Demo ecosystem"
        title="Three products. One credential package. One unmistakable unlock moment."
        description="Protocol access resolves against live wallet state, risk posture, and product-level policy requirements."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricStat label="Eligible products" value={`${unlockedCount} / 3`} accent hint="Live count derived from wallet tier and risk score." />
        <MetricStat label="Connected wallet" value={address ? shortAddress(address) : "Not connected"} hint="The decision engine reads this wallet's active credential state." />
        <MetricStat label="Policy layer" value="AI + ZK" hint="Protocol access combines credential tiering with AI risk posture." />
      </div>

      {executionError ? <ErrorState title="Protocol transaction interrupted" description={executionError} /> : null}

      {!address ? (
        <EmptyState
          title="Connect a wallet to open the ecosystem"
          description="The demo page resolves protocol access from live wallet state. Connect first, then return to this page to watch the cards unlock."
        />
      ) : protocolState.isError ? (
        <ErrorState
          title="Protocol access could not be evaluated"
          description={protocolState.error instanceof Error ? protocolState.error.message : "The current network surface is unavailable. Confirm the local chain is running and the wallet is on the correct network."}
        />
      ) : protocolState.isLoading ? (
        <LoadingState title="Evaluating protocol access" description="The client is pulling protocol requirements and comparing them against your active credential state." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            {protocolState.data?.map((protocol, index) => {
              const unlocked = protocol.eligibility.allowed;
              return (
                <motion.div
                  key={protocol.key}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: index * 0.12, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                  <DoubleBezelCard className="overflow-hidden">
                    <div className="relative p-5 sm:p-6 lg:p-7">
                      <div className={`ambient-orb right-0 top-0 h-36 w-36 ${unlocked ? "bg-[var(--color-accent-success)]/16" : "bg-[var(--color-accent-danger)]/14"}`} />
                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusPill status={unlocked ? "success" : "danger"}>
                              {unlocked ? "Access granted" : "Restricted"}
                            </StatusPill>
                            <TierBadge tier={protocol.requirements.minTier} />
                          </div>
                          <h3 className="mt-5 text-2xl font-medium tracking-tight sm:text-3xl">{protocol.title}</h3>
                          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-content-secondary)]">{protocol.subline}</p>
                          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[var(--color-base)]/80 p-4 sm:p-5">
                            <div className="grid gap-3 md:grid-cols-3">
                              <div>
                                <p className="text-kicker">Product signal</p>
                                <p className="mt-2 break-words font-mono text-sm text-[var(--color-content-primary)]">{protocol.metric}</p>
                              </div>
                              <div>
                                <p className="text-kicker">Wallet tier</p>
                                <p className="mt-2 font-mono text-sm text-[var(--color-content-primary)]">{protocol.eligibility.tier}</p>
                              </div>
                              <div>
                                <p className="text-kicker">Risk posture</p>
                                <p className="mt-2 font-mono text-sm text-[var(--color-content-primary)]">{protocol.eligibility.riskScore}</p>
                              </div>
                            </div>
                            <div className="mt-4 h-px bg-white/10" />
                            <p className="mt-4 break-words text-sm leading-7 text-[var(--color-content-secondary)]">{protocol.eligibility.reason}</p>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-col justify-between gap-4 xl:gap-5">
                          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                            <div className="flex flex-wrap items-center gap-3">
                              {unlocked ? <CheckCircle size={22} className="text-[var(--color-accent-success)]" weight="fill" /> : <LockSimple size={22} className="text-[var(--color-accent-danger)]" />}
                              <p className="text-sm font-medium text-[var(--color-content-primary)]">{unlocked ? "Execution path open" : "Waiting on eligibility"}</p>
                            </div>
                            <p className="mt-4 break-words text-sm leading-7 text-[var(--color-content-secondary)]">
                              {unlocked
                                ? "This protocol now sees a wallet that satisfies policy, tier, and risk constraints."
                                : "The protocol will remain unavailable until the connected wallet satisfies both tier and risk requirements."}
                            </p>
                          </div>
                          <MagneticButton className="w-full justify-center" onClick={() => executeProtocol(protocol.key)} disabled={!unlocked || activeExecution !== null}>
                            {activeExecution === protocol.key ? "Submitting transaction" : protocol.cta}
                          </MagneticButton>
                        </div>
                      </div>
                    </div>
                  </DoubleBezelCard>
                </motion.div>
              );
            })}
          </div>

          <DoubleBezelCard className="h-fit">
            <div className="surface-pad-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Robot size={20} className="text-[var(--color-accent-info)]" weight="duotone" />
                </div>
                <div>
                  <p className="text-kicker">AI compliance agent</p>
                  <h3 className="mt-2 text-2xl font-medium tracking-tight">Operational decision rail</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--color-content-secondary)]">
                This panel demonstrates the agentic layer: protocol requirements are read, wallet posture is evaluated, and a single decision is returned before execution.
              </p>
              <div className="mt-8 space-y-3 rounded-[1.5rem] border border-white/10 bg-[var(--color-base)]/80 p-5 font-mono text-sm">
                <p className="text-[var(--color-content-muted)]">&gt; Reading connected wallet posture...</p>
                <p className="text-[var(--color-content-muted)]">&gt; Resolving protocol requirement map...</p>
                {protocolState.data?.map((entry) => (
                  <p key={entry.key} className={entry.eligibility.allowed ? "text-emerald-300" : "text-amber-200"}>
                    &gt; canParticipate({entry.title.replaceAll(" ", "")}) → {entry.eligibility.allowed ? "ALLOWED" : "BLOCKED"}
                  </p>
                ))}
              </div>
              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <ShieldWarning size={18} className="text-[var(--color-accent-warning)]" />
                  <p className="text-sm font-medium">Decision quality</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--color-content-secondary)]">
                  The AI layer is useful precisely because the policy surface is structured: tiering, risk, and protocol constraints all settle into one deterministic answer.
                </p>
                <div className="mt-6">
                  <Link to="/docs">
                    <MagneticButton variant="ghost">View system docs</MagneticButton>
                  </Link>
                </div>
              </div>
            </div>
          </DoubleBezelCard>
        </div>
      )}
    </div>
  );
}
