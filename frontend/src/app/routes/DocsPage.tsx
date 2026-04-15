import { useQuery } from "@tanstack/react-query";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { fetchAnalytics, fetchAttesters, fetchHealth } from "@/lib/oracle";
import { appConfig, credentialCatalog, ORACLE_DISPLAY_URL } from "@/lib/config";

export function DocsPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth });
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });
  const attesters = useQuery({ queryKey: ["attesters"], queryFn: fetchAttesters });

  return (
    <div className="page-frame">
      <SectionHeader
        eyebrow="Vision and docs"
        title="What CompliancePass is building for HashKey Chain."
        description="This page gives judges, partners, and technical reviewers a direct summary of the product vision, architecture, and current network surface."
        aside={
          health.isLoading ? (
            <StatusPill status="neutral">Checking backend</StatusPill>
          ) : health.data?.ok ? (
            <StatusPill status="success">{appConfig.networkMode === "local" ? "Local services online" : "Testnet connected"}</StatusPill>
          ) : (
            <StatusPill status="warning">Backend unavailable</StatusPill>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DoubleBezelCard>
          <div className="surface-pad">
            <p className="text-kicker">Vision</p>
            <h3 className="mt-4 text-3xl font-medium tracking-tight">Compliance should be a reusable network primitive, not a protocol-by-protocol burden.</h3>
            <div className="mt-6 space-y-4 text-base leading-8 text-[var(--color-content-secondary)]">
              <p>CompliancePass lets a user verify once, hold a wallet-bound credential, and move across compliant products without repeatedly exposing sensitive personal information.</p>
              <p>For HashKey, the product turns a compliance-first chain identity into a composable advantage: protocols integrate faster, institutions gain clearer access control, and regulators see aggregate telemetry without identity leakage.</p>
            </div>
          </div>
        </DoubleBezelCard>

        <DoubleBezelCard>
          <div className="surface-pad">
            <p className="text-kicker">Network status</p>
            {health.isLoading ? (
              <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-[var(--color-content-primary)]">Checking services</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-content-secondary)]">Reading oracle health and network alignment.</p>
              </div>
            ) : health.isError ? (
              <div className="mt-6 rounded-[1.4rem] border border-red-400/20 bg-red-400/8 p-5">
                <p className="text-sm font-medium text-[var(--color-content-primary)]">Backend unavailable</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-content-secondary)]">The oracle health endpoint could not be reached for this environment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-kicker">Current environment</p>
                  <p className="mt-2 text-xl font-medium">{appConfig.networkLabel}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-kicker">Oracle endpoint</p>
                  <p className="mt-2 break-all font-mono text-sm text-[var(--color-content-primary)]">{ORACLE_DISPLAY_URL}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-kicker">Latest synced block</p>
                  <p className="mt-2 font-mono text-sm text-[var(--color-content-primary)]">{health.data?.blockNumber ?? "Unavailable"}</p>
                </div>
              </div>
            )}
          </div>
        </DoubleBezelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Credential model</p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">Tiered access from reusable credential bits.</h3>
            <div className="mt-6 space-y-3">
              {credentialCatalog.map((credential) => (
                <div key={credential.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">{credential.name}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-content-secondary)]">{credential.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </DoubleBezelCard>

        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Architecture</p>
            <h3 className="mt-4 text-2xl font-medium tracking-tight">Five connected layers.</h3>
            <div className="mt-6 space-y-3 text-sm leading-7 text-[var(--color-content-secondary)]">
              <p>1. Wallet-native identity creation using Semaphore-compatible commitments.</p>
              <p>2. Oracle-mediated attester approval and verified-group membership updates.</p>
              <p>3. Browser-side proof generation and on-chain credential minting.</p>
              <p>4. Protocol gating through tier checks, credential checks, and AI risk thresholds.</p>
              <p>5. Regulator and partner visibility through aggregate analytics and portable VC export.</p>
            </div>
          </div>
        </DoubleBezelCard>

        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Live metrics</p>
            {analytics.isLoading || attesters.isLoading ? (
              <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-[var(--color-content-primary)]">Loading docs metrics</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-content-secondary)]">Pulling aggregate stats for the current environment.</p>
              </div>
            ) : analytics.isError || attesters.isError ? (
              <div className="mt-6 rounded-[1.25rem] border border-red-400/20 bg-red-400/8 p-4">
                <p className="text-sm font-medium text-[var(--color-content-primary)]">Metrics unavailable</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-content-secondary)]">The current environment is not serving analytics.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-kicker">Credentials issued</p>
                  <p className="mt-2 text-2xl font-medium">{analytics.data?.totalCredentials ?? "0"}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-kicker">Approved attesters</p>
                  <p className="mt-2 text-2xl font-medium">{attesters.data?.attesters.filter((item) => item.approved).length ?? 0}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-kicker">Integrated protocols</p>
                  <p className="mt-2 text-2xl font-medium">{analytics.data?.activeProtocols ?? 3}</p>
                </div>
              </div>
            )}
          </div>
        </DoubleBezelCard>
      </div>
    </div>
  );
}
