import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Copy, DownloadSimple, ShieldCheck } from "@phosphor-icons/react";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TierBadge } from "@/components/ui/TierBadge";
import { RiskScoreMeter } from "@/components/ui/RiskScoreMeter";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { exportCredential, getComplianceReport } from "@/lib/complianceAgent";
import { credentialCatalog } from "@/lib/config";
import { shortAddress } from "@/lib/utils";

export function CredentialPage() {
  const { address } = useAccount();

  const report = useQuery({
    queryKey: ["compliance-report", address],
    queryFn: () => getComplianceReport(address!),
    enabled: Boolean(address),
  });

  const exported = useQuery({
    queryKey: ["credential-export", address],
    queryFn: () => exportCredential(address!),
    enabled: Boolean(address),
  });

  const activeCredentialNames = credentialCatalog
    .filter((item) => ((report.data?.bitmask ?? 0) & (1 << item.id)) !== 0)
    .map((item) => item.name);

  function handleCopy() {
    if (!exported.data) return;
    navigator.clipboard.writeText(JSON.stringify(exported.data, null, 2));
  }

  function handleDownload() {
    if (!exported.data || !address) return;
    const blob = new Blob([JSON.stringify(exported.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliancepass-${address}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!address) {
    return (
      <div className="page-frame-tight">
        {header}
        <EmptyState title="Connect a wallet to inspect the credential object" description="This page reads active credential state from the connected wallet and exports the signed VC payload." />
      </div>
    );
  }

  if (report.isLoading || exported.isLoading) {
    return (
      <div className="page-frame-tight">
        {header}
        <LoadingState title="Loading credential object" description="Reading active wallet posture and requesting the signed VC export from the oracle." />
      </div>
    );
  }

  if (report.isError || exported.isError || !report.data || !exported.data) {
    return (
      <div className="page-frame-tight">
        {header}
        <ErrorState
          title="Credential unavailable"
          description={(report.error instanceof Error && report.error.message) || (exported.error instanceof Error && exported.error.message) || "The connected wallet either has no active credential or the export endpoint could not be reached."}
        />
      </div>
    );
  }

  if (report.data.tokenId === 0) {
    return (
      <div className="page-frame-tight">
        {header}
        <EmptyState title="No credential found" description="Run the verification flow first, then return here to export the portable VC payload." />
      </div>
    );
  }

  return (
    <div className="page-frame">
      {header}

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <DoubleBezelCard>
          <div className="surface-pad">
            <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                  <ShieldCheck size={24} className="text-[var(--color-accent-success)]" weight="duotone" />
                </div>
                <StatusPill status="success">Portable VC ready</StatusPill>
              </div>
              <div className="mt-14">
                <p className="text-kicker">Wallet-bound credential slab</p>
                <h3 className="mt-4 text-3xl font-medium tracking-tight">{shortAddress(address)}</h3>
                <div className="mt-6 flex flex-wrap gap-2">
                  {activeCredentialNames.map((name) => (
                    <StatusPill key={name} status="neutral">{name}</StatusPill>
                  ))}
                </div>
              </div>
              <div className="mt-10 grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-kicker">Token id</span>
                  <span className="font-mono text-sm">{report.data.tokenId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-kicker">Current tier</span>
                  <TierBadge tier={report.data.tier} />
                </div>
                <RiskScoreMeter score={report.data.riskScore} className="mt-4" />
              </div>
            </div>
          </div>
        </DoubleBezelCard>

        <div className="space-y-8">
          <DoubleBezelCard>
            <div className="surface-pad">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-kicker">Export actions</p>
                  <h3 className="mt-3 text-3xl font-medium tracking-tight">Signed VC payload</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <MagneticButton variant="ghost" onClick={handleCopy} icon={<Copy size={16} weight="bold" />}>
                    Copy
                  </MagneticButton>
                  <MagneticButton onClick={handleDownload} icon={<DownloadSimple size={16} weight="bold" />}>
                    Download JSON
                  </MagneticButton>
                </div>
              </div>
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[var(--color-base)]/80">
                <pre className="premium-scrollbar max-h-[460px] overflow-auto p-5 text-sm leading-7 text-[var(--color-content-secondary)]">
                  {JSON.stringify(exported.data, null, 2)}
                </pre>
              </div>
            </div>
          </DoubleBezelCard>

          <DoubleBezelCard>
            <div className="surface-pad">
              <p className="text-kicker">Why this matters</p>
              <h3 className="mt-4 text-2xl font-medium tracking-tight">The credential is useful beyond a single protocol session.</h3>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--color-content-secondary)]">
                <p>Use it as an exportable, signed proof object for bank onboarding, regulated distribution workflows, or cross-system verification.</p>
                <p>Because the wallet-bound credential keeps identity off-chain, the portable VC becomes the trust envelope for systems that need assurance without direct chain inspection.</p>
              </div>
            </div>
          </DoubleBezelCard>
        </div>
      </div>
    </div>
  );
}
  const header = (
    <SectionHeader
      eyebrow="Credential export"
      title="Portable compliance state in one premium object."
      description="This page presents the active Soulbound credential and the signed W3C Verifiable Credential payload for downstream verification."
    />
  );
