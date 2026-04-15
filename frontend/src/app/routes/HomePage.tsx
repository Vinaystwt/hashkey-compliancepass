import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, LockKeyOpen, ShieldCheck, Stack, TrendUp } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { MetricStat } from "@/components/ui/MetricStat";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { fetchAnalytics, fetchAttesters } from "@/lib/oracle";
import { TierBadge } from "@/components/ui/TierBadge";

const protocols = [
  {
    title: "Government Bond Fund",
    detail: "Tokenized sovereign debt exposure with institutional-grade gating.",
    tier: 3,
    stat: "4.50% APY",
  },
  {
    title: "Stablecoin Mint",
    detail: "Compliant issuance for the ecosystem reserve layer.",
    tier: 2,
    stat: "HKUSD rail",
  },
  {
    title: "Credit Facility",
    detail: "AI-risk-aware underwriting for eligible participants.",
    tier: 2,
    stat: "Risk ≤ 50",
  },
] as const;

const premiumEase = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: premiumEase } },
};

export function HomePage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });
  const attesters = useQuery({ queryKey: ["attesters"], queryFn: fetchAttesters });

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-28 pb-20 pt-6 md:gap-32 md:pt-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border-hairline)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-14 md:px-10 md:py-20">
        <div className="compliance-lattice opacity-60" />
        <div className="ambient-orb left-[8%] top-[15%] h-56 w-56 bg-[var(--color-accent-info)]/15" />
        <div className="ambient-orb bottom-[10%] right-[10%] h-72 w-72 bg-[var(--color-accent-success)]/12" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
            <motion.div variants={fadeUp}>
              <StatusPill status="success">Compliance infrastructure for HashKey Chain</StatusPill>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-8 text-kicker">
              Next-generation compliance network
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-5 max-w-4xl text-[clamp(3rem,11vw,4.75rem)] font-semibold tracking-[-0.06em] text-[var(--color-content-primary)] md:text-7xl md:leading-[0.95]">
              Verify once. Move through compliant capital markets with zero personal data exposure.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-8 max-w-2xl text-lg leading-8 text-[var(--color-content-secondary)]">
              CompliancePass gives HashKey-native products a shared compliance layer: private verification, reusable wallet-bound credentials, AI-aware risk posture, and faster protocol onboarding.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/verify">
                <MagneticButton icon={<ArrowRight size={16} weight="bold" />}>Get your credential</MagneticButton>
              </Link>
              <Link to="/demo">
                <MagneticButton variant="ghost">View demo ecosystem</MagneticButton>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: premiumEase }}
            className="grid gap-4"
          >
            <DoubleBezelCard>
              <div className="relative overflow-hidden rounded-[calc(2rem-0.4rem)] p-8">
                <div className="ambient-orb left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-accent-success)]/20" />
                <div className="relative flex min-h-[320px] flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-kicker">Credential slab</p>
                      <h3 className="mt-3 text-2xl font-medium tracking-tight">Institutional access object</h3>
                    </div>
                    <StatusPill status="info">Portable VC</StatusPill>
                  </div>
                  <motion.div
                    animate={{ rotateX: [-8, 8, -8], rotateY: [10, -10, 10], y: [-10, 10, -10] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto mt-10 flex h-48 w-full max-w-[18rem] origin-center items-center justify-center rounded-[2rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] shadow-[0_32px_70px_rgba(0,0,0,0.36)]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="flex w-full flex-col gap-6 px-8">
                      <div className="flex items-center justify-between">
                        <ShieldCheck size={28} className="text-[var(--color-accent-success)]" weight="duotone" />
                        <StatusPill status="success">Tiered access</StatusPill>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-1 rounded-full bg-white/20" />
                        <div className="h-1 rounded-full bg-[var(--color-accent-success)]/60" />
                        <div className="h-1 rounded-full bg-[var(--color-accent-info)]/40" />
                      </div>
                      <div className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--color-content-secondary)]">
                        Zero personal data on-chain
                      </div>
                    </div>
                  </motion.div>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-kicker">Attesters</p>
                      <p className="mt-2 text-lg">Multi-source</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-kicker">Risk</p>
                      <p className="mt-2 text-lg">AI-scored</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-kicker">Access</p>
                      <p className="mt-2 text-lg">Portable</p>
                    </div>
                  </div>
                </div>
              </div>
            </DoubleBezelCard>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.isLoading || attesters.isLoading ? (
          <LoadingState title="Syncing network telemetry" description="Pulling live system state from the oracle and local chain." />
        ) : analytics.isError || attesters.isError ? (
          <ErrorState title="Network telemetry unavailable" description="The current environment is not serving analytics. Start the local chain and oracle, or switch to the testnet deployment." />
        ) : (
          <>
            <MetricStat label="Credentials issued" value={analytics.data?.totalCredentials ?? "0"} accent hint="Live aggregate from the credential contract." />
            <MetricStat label="Personal data on-chain" value="0 bytes" hint="Compliance data stays off-chain; only proofs and access state settle." />
            <MetricStat label="Protocols integrated" value={analytics.data?.activeProtocols ?? 3} hint="The ecosystem demo currently exposes three gated products." />
            <MetricStat label="Attesters available" value={attesters.data?.attesters.length ?? 0} hint="Approved attesters can stake, issue, and monetize compliance flow." />
          </>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <SectionHeader
            eyebrow="Why this exists"
            title="Compliance becomes reusable infrastructure instead of repeated friction."
            description="Every protocol on a compliance-first chain needs access control that regulators can trust and users can reuse. CompliancePass turns that burden into a common, elegant primitive."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Fingerprint,
              title: "Private verification",
              body: "Wallet signatures generate a reusable ZK identity. Identity commitments join verified groups without revealing personal data.",
            },
            {
              icon: Stack,
              title: "Protocol portability",
              body: "The same credential package unlocks multiple compliant products, reducing fragmented onboarding across the ecosystem.",
            },
            {
              icon: TrendUp,
              title: "AI risk overlay",
              body: "Wallet risk scoring creates a dynamic access layer for products that need more than a binary allowlist.",
            },
            {
              icon: LockKeyOpen,
              title: "Regulator-grade telemetry",
              body: "Aggregate analytics, attester data, and revocation visibility give stakeholders confidence without leaking sensitive identity.",
            },
          ].map((item) => (
            <DoubleBezelCard key={item.title} className="h-full">
              <div className="flex h-full flex-col p-6">
                <item.icon size={22} className="text-[var(--color-accent-info)]" weight="duotone" />
                <h3 className="mt-5 text-xl font-medium tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-content-secondary)]">{item.body}</p>
              </div>
            </DoubleBezelCard>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeader
          eyebrow="Ecosystem preview"
          title="Three products. One credential experience."
          description="The demo surface shows how one guided verification flow can fan out across RWA, payments, and institutional credit."
          aside={
            <Link to="/demo">
              <MagneticButton variant="ghost">Open demo</MagneticButton>
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {protocols.map((protocol, index) => (
            <motion.div
              key={protocol.title}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.1, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <DoubleBezelCard className="h-full">
                <div className="relative flex h-full flex-col p-7">
                  <div className="ambient-orb right-0 top-6 h-28 w-28 bg-[var(--color-accent-success)]/10" />
                  <StatusPill status="danger">Locked by default</StatusPill>
                  <div className="mt-6 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-medium tracking-tight">{protocol.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--color-content-secondary)]">{protocol.detail}</p>
                    </div>
                    <TierBadge tier={protocol.tier} />
                  </div>
                  <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-[var(--color-base)]/70 p-5">
                    <p className="text-kicker">Access state</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-[var(--color-content-secondary)]">Protocol condition</span>
                      <span className="font-mono text-sm text-[var(--color-content-primary)]">{protocol.stat}</span>
                    </div>
                    <div className="mt-4 h-px bg-white/10" />
                    <p className="mt-4 text-sm text-[var(--color-content-secondary)]">
                      Once the credential bundle is active, eligible cards transition from restricted to live in one motion sequence.
                    </p>
                  </div>
                </div>
              </DoubleBezelCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <DoubleBezelCard className="h-full">
          <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-7 lg:p-8">
            <div className="flex min-w-0 flex-col">
              <p className="text-kicker">Trusted attesters</p>
              <h3 className="mt-4 text-3xl font-medium tracking-tight">Multi-attester infrastructure without fragmented onboarding.</h3>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-content-secondary)]">
                Issuers can register, stake, and serve as trusted verification sources. That turns compliance from a single-admin bottleneck into a reusable ecosystem service.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="flex min-h-[132px] flex-col rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-kicker">Approved issuers</p>
                  <p className="mt-2 text-2xl font-medium">{attesters.data?.attesters.filter((item) => item.approved).length ?? 0}</p>
                </div>
                <div className="flex min-h-[132px] flex-col rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-kicker">Credential network</p>
                  <p className="mt-2 break-words text-sm leading-7 text-[var(--color-content-secondary)]">
                    Wallets carry portable access state instead of repeating the same compliance journey protocol by protocol.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {(attesters.data?.attesters ?? []).map((attester) => (
                <div
                  key={attester.attester}
                  className="flex min-w-0 flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-content-primary)]">{attester.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--color-content-muted)]">{attester.attester}</p>
                  </div>
                  <StatusPill status={attester.approved ? "success" : "neutral"}>{attester.approved ? "Approved" : "Pending"}</StatusPill>
                </div>
              ))}
            </div>
          </div>
        </DoubleBezelCard>
        <DoubleBezelCard className="h-full">
          <div className="flex h-full flex-col p-6 sm:p-7 lg:p-8">
            <p className="text-kicker">AI + compliance</p>
            <h3 className="mt-4 text-3xl font-medium tracking-tight">Agentic DeFi only works when policy, risk, and access stay in sync.</h3>
            <p className="mt-5 text-sm leading-7 text-[var(--color-content-secondary)]">
              CompliancePass ties on-chain credential state to AI risk signals and protocol requirements, so an agent can ask one system whether execution is permitted before capital moves.
            </p>
            <div className="mt-10 grid gap-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-kicker">Step 1</p>
                <p className="mt-2 text-sm text-[var(--color-content-secondary)]">Read credential state and current tier.</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-kicker">Step 2</p>
                <p className="mt-2 text-sm text-[var(--color-content-secondary)]">Overlay risk score and protocol-specific requirements.</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-kicker">Step 3</p>
                <p className="mt-2 text-sm text-[var(--color-content-secondary)]">Return an unambiguous allowed / blocked decision with reasons.</p>
              </div>
            </div>
          </div>
        </DoubleBezelCard>
      </section>

      <section className="pb-4">
        <DoubleBezelCard>
          <div className="grid gap-8 p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-kicker">Next step</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Activate your credential and open the full product suite.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-content-secondary)]">
                Start with one guided verification flow, then carry that access state across compliant products, analytics surfaces, and portable credential export.
              </p>
            </div>
            <Link to="/verify">
              <MagneticButton icon={<ArrowRight size={16} weight="bold" />}>Launch verification</MagneticButton>
            </Link>
          </div>
        </DoubleBezelCard>
      </section>
    </div>
  );
}
