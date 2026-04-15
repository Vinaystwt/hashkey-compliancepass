import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAccount, useSignMessage, useWriteContract } from "wagmi";
import { SealCheck, Signature, ShieldCheck } from "@phosphor-icons/react";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierBadge } from "@/components/ui/TierBadge";
import { RiskScoreMeter } from "@/components/ui/RiskScoreMeter";
import { ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { appConfig, credentialCatalog } from "@/lib/config";
import { getIdentityMessage, getOrCreateIdentity } from "@/lib/identity";
import { abis, getWalletCompliance, publicClient } from "@/lib/onchain";
import { postRiskScore, postVerify } from "@/lib/oracle";
import deployedAddresses from "@/lib/deployedAddresses.json";
import { formatDate } from "@/lib/utils";
import { generateSemaphoreCredentialProof } from "@/lib/proofs";

const bundles = [
  {
    id: "foundation",
    label: "Foundation Pack",
    summary: "Low-friction access for introductory compliant surfaces and early ecosystem entry.",
    tier: 1,
    credentials: [0, 1],
  },
  {
    id: "market",
    label: "Market Access Pack",
    summary: "Standard compliant posture for stablecoin and credit-adjacent participation.",
    tier: 2,
    credentials: [1, 3],
  },
  {
    id: "institutional",
    label: "Institutional Access Pack",
    summary: "The full demo path: jurisdiction, accreditation, and stronger KYC in one guided sequence.",
    tier: 3,
    credentials: [1, 2, 3, 4],
  },
] as const;

type VerifyStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const [activeBundle, setActiveBundle] = useState<(typeof bundles)[number]>(bundles[2]);
  const [step, setStep] = useState<VerifyStep>(0);
  const [status, setStatus] = useState("Connect a wallet to begin.");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [riskScore, setRiskScoreState] = useState(25);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [lastIssuedCredentials, setLastIssuedCredentials] = useState<number[]>([]);
  const isBusy = step > 0 && step < 6;

  const visualSteps = useMemo(
    () => ["Connect", "Select", "Sign", "Verify", "Prove", "Mint", "Unlock"],
    []
  );

  async function handleBegin() {
    if (!address) return;

    try {
      setError(null);
      setCompleted([]);
      setIssuedAt(null);
      setLastIssuedCredentials([]);
      setStep(1);
      setStatus("Package selected. Preparing a reusable browser-local ZK identity.");

      const currentState = await getWalletCompliance(address);
      const missingCredentials = activeBundle.credentials.filter((credentialType) => (currentState.bitmask & (1 << credentialType)) === 0);

      if (missingCredentials.length === 0) {
        setRiskScoreState(currentState.riskScore);
        setIssuedAt(new Date().toISOString());
        setLastIssuedCredentials([...activeBundle.credentials]);
        setCompleted([0, 1, 2, 3, 4, 5, 6]);
        setStep(6);
        setStatus("This wallet already satisfies the selected package. The demo ecosystem is ready to open.");
        return;
      }

      const message = getIdentityMessage(appConfig.activeChain.id, address);
      setStep(2);
      const signature = await signMessageAsync({ message });
      const identity = getOrCreateIdentity(address, signature);
      setCompleted([0, 1, 2]);

      setStep(3);
      setStatus("Aligning AI risk posture and submitting your cryptographic identity to the attester flow.");
      await postRiskScore(address, 25);
      setRiskScoreState(25);

      for (const credentialType of missingCredentials) {
        await postVerify(identity.commitment.toString(), credentialType);
      }
      setCompleted([0, 1, 2, 3]);

      setStep(4);
      setStatus("Generating zero-knowledge proofs locally in the browser for each missing credential.");

      for (const credentialType of missingCredentials) {
        const proof = await generateSemaphoreCredentialProof(identity, credentialType, address);
        setStep(5);
        setStatus(`Minting ${credentialCatalog[credentialType].name} on-chain.`);

        const hash = await writeContractAsync({
          address: deployedAddresses.compliancePass as `0x${string}`,
          abi: abis.compliancePass,
          functionName: "mintCredential",
          args: [credentialType, proof],
        });

        setStatus(`Awaiting confirmation for ${credentialCatalog[credentialType].name}.`);
        await publicClient.waitForTransactionReceipt({ hash });
        setCompleted((current) => Array.from(new Set([...current, 4, 5])));
      }

      setIssuedAt(new Date().toISOString());
      setLastIssuedCredentials(missingCredentials);
      setCompleted([0, 1, 2, 3, 4, 5, 6]);
      setStep(6);
      setStatus("Credential package active. The full demo ecosystem is now available.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Verification failed.";
      setError(message);
      setStatus("Verification interrupted.");
    }
  }

  return (
    <div className="page-frame">
      <SectionHeader
        eyebrow="Verification flow"
        title="Guided compliance issuance with wallet-native orchestration and premium clarity."
        description="This flow signs once, registers your cryptographic identity with the attester, generates browser-side zero-knowledge proofs, and mints the credential package that unlocks the ecosystem demo."
      />

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <DoubleBezelCard>
          <div className="surface-pad">
            <p className="text-kicker">Flow status</p>
            <div className="mt-8 grid gap-4">
              {visualSteps.map((label, index) => {
                const isDone = completed.includes(index);
                const isCurrent = step === index;
                return (
                  <div key={label} className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${isDone ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : isCurrent ? "border-white/20 bg-white/[0.06] text-white" : "border-white/10 bg-white/[0.03] text-[var(--color-content-muted)]"}`}>
                      {isDone ? <SealCheck size={18} weight="fill" /> : <span className="text-sm">{index + 1}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-content-primary)]">{label}</p>
                      <p className="mt-1 text-xs text-[var(--color-content-secondary)]">
                        {index === 0 && "Wallet connection and network alignment"}
                        {index === 1 && "Access package selection"}
                        {index === 2 && "Deterministic Semaphore identity"}
                        {index === 3 && "Attester + AI risk orchestration"}
                        {index === 4 && "Zero-knowledge proof generation"}
                        {index === 5 && "On-chain credential issuance"}
                        {index === 6 && "Protocol access unlocked"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-[var(--color-base)]/80 p-5">
              <p className="text-kicker">Live system status</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-content-secondary)]">{status}</p>
            </div>
            <div className="mt-8">
              <RiskScoreMeter score={riskScore} />
            </div>
          </div>
        </DoubleBezelCard>

        <div className="space-y-8">
          <DoubleBezelCard>
            <div className="surface-pad">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-kicker">Credential package</p>
                  <h3 className="mt-3 text-3xl font-medium tracking-tight">Choose the access posture you want to activate.</h3>
                </div>
                {isConnected ? <StatusPill status="success">Wallet connected</StatusPill> : <StatusPill status="warning">Wallet required</StatusPill>}
              </div>
              <div className="mt-8 grid gap-4">
                {bundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => setActiveBundle(bundle)}
                    className={`rounded-[1.5rem] border p-5 text-left transition-all duration-300 ease-[var(--bezier-premium)] ${activeBundle.id === bundle.id ? "border-emerald-400/20 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:-translate-y-[2px] hover:border-white/20"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-medium tracking-tight">{bundle.label}</h4>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-content-secondary)]">{bundle.summary}</p>
                      </div>
                      <TierBadge tier={bundle.tier} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {bundle.credentials.map((id) => (
                        <StatusPill key={id} status="neutral">
                          {credentialCatalog[id].name}
                        </StatusPill>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <MagneticButton onClick={handleBegin} disabled={!isConnected || isBusy} icon={<Signature size={16} weight="bold" />}>
                  {isBusy ? "Verification in progress" : "Start guided verification"}
                </MagneticButton>
              </div>
            </div>
          </DoubleBezelCard>

          {error ? <ErrorState title="Verification flow interrupted" description={error} /> : null}

          {step > 0 && step < 6 ? (
            <LoadingState
              title="Issuing your credential package"
              description="Browser-side proof generation can take a moment while the app syncs verified group state and submits the on-chain mint transactions."
            />
          ) : null}

          {step === 6 && issuedAt ? (
            <motion.div initial={{ opacity: 0, y: 24, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}>
              <DoubleBezelCard>
                <div className="grid gap-8 surface-pad xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="flex min-h-[320px] w-full max-w-[280px] flex-col justify-between rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] p-6 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
                      initial={{ rotateX: 12, rotateY: -16, scale: 0.94 }}
                      animate={{ rotateX: 0, rotateY: 0, scale: 1 }}
                      transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="flex items-center justify-between">
                        <ShieldCheck size={28} className="text-[var(--color-accent-success)]" weight="duotone" />
                        <StatusPill status="success">Active</StatusPill>
                      </div>
                      <div>
                        <p className="text-kicker">CompliancePass</p>
                        <h3 className="mt-3 break-words text-[1.75rem] font-medium leading-tight tracking-tight">{activeBundle.label}</h3>
                        <p className="mt-4 break-words text-sm leading-7 text-[var(--color-content-secondary)]">
                          Issued through a guided compliance workflow with browser-side proof generation and protocol-ready access state.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <TierBadge tier={activeBundle.tier} />
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-content-secondary)]">Issued {formatDate(issuedAt)}</p>
                      </div>
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-kicker">Issued credential package</p>
                    <h3 className="mt-4 text-3xl font-medium tracking-tight">The ecosystem is now live for this wallet.</h3>
                    <p className="mt-4 text-base leading-7 text-[var(--color-content-secondary)]">
                      This package activates the core demo path. Head to the demo page to see the protocol cards unlock based on your active tier and risk posture.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-2">
                      {lastIssuedCredentials.map((id) => (
                        <StatusPill key={id} status="success">
                          {credentialCatalog[id].name}
                        </StatusPill>
                      ))}
                    </div>
                    <div className="mt-8">
                      <RiskScoreMeter score={riskScore} label="Issued posture" />
                    </div>
                    <div className="mt-10 flex flex-wrap gap-4">
                      <Link to="/demo">
                        <MagneticButton icon={<SealCheck size={16} weight="bold" />}>Open demo ecosystem</MagneticButton>
                      </Link>
                      <Link to="/credential">
                        <MagneticButton variant="ghost">View credential export</MagneticButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </DoubleBezelCard>
            </motion.div>
          ) : null}

          <DoubleBezelCard>
            <div className="surface-pad">
              <p className="text-kicker">Technical disclosure</p>
              <h3 className="mt-4 text-2xl font-medium tracking-tight">What the interface is doing behind the scenes.</h3>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--color-content-secondary)]">
                <p>The wallet signs a deterministic message to derive a browser-local Semaphore identity. Only the identity commitment is forwarded to the attester flow.</p>
                <p>The oracle adds that commitment to the relevant verified groups for each missing credential type. The browser then reconstructs the group, generates proofs locally, and submits one on-chain mint per missing credential.</p>
                <p>The result is a wallet-bound soulbound credential package that updates tiering, risk-aware access, and protocol eligibility across the rest of the experience without exposing personal data on-chain.</p>
              </div>
            </div>
          </DoubleBezelCard>
        </div>
      </div>
    </div>
  );
}
