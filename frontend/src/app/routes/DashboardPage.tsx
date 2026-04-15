import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { MetricStat } from "@/components/ui/MetricStat";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/StateBlocks";
import { appConfig } from "@/lib/config";
import { fetchAnalytics, fetchAttesters } from "@/lib/oracle";
import { formatNumber } from "@/lib/utils";

export function DashboardPage() {
  const analytics = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });
  const attesters = useQuery({ queryKey: ["attesters"], queryFn: fetchAttesters });

  const credentialDistribution = useMemo(
    () => analytics.data?.credentialsByType.map((entry) => ({ name: `Type ${entry.bit}`, count: Number(entry.count) })) ?? [],
    [analytics.data]
  );

  const riskChart = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    for (const score of analytics.data?.riskDistribution ?? []) {
      if (score <= 25) buckets[0] += 1;
      else if (score <= 50) buckets[1] += 1;
      else if (score <= 75) buckets[2] += 1;
      else buckets[3] += 1;
    }
    return [
      { label: "0-25", value: buckets[0] },
      { label: "26-50", value: buckets[1] },
      { label: "51-75", value: buckets[2] },
      { label: "76-100", value: buckets[3] },
    ];
  }, [analytics.data]);

  const issuanceCurve = useMemo(
    () =>
      credentialDistribution.map((entry, index) => ({
        time: `T${index + 1}`,
        value: entry.count,
      })),
    [credentialDistribution]
  );

  const header = (
    <SectionHeader
      eyebrow="Regulatory dashboard"
      title="Live compliance telemetry without exposing identity."
      description="This view is designed for stakeholders who need confidence in the system, not access to personal data. Every metric is aggregate-first and protocol-aware."
      aside={<StatusPill status="success">Live · {appConfig.networkLabel}</StatusPill>}
    />
  );

  if (analytics.isLoading || attesters.isLoading) {
    return (
      <div className="page-frame-tight">
        {header}
        <LoadingState title="Loading regulator-grade telemetry" description="Pulling aggregate system state, attester data, and risk distribution." />
      </div>
    );
  }

  if (analytics.isError || attesters.isError || !analytics.data || !attesters.data) {
    return (
      <div className="page-frame-tight">
        {header}
        <ErrorState
          title="Dashboard unavailable"
          description={(analytics.error instanceof Error && analytics.error.message) || (attesters.error instanceof Error && attesters.error.message) || "The oracle or local chain could not provide the required telemetry."}
        />
      </div>
    );
  }

  return (
    <div className="page-frame">
      {header}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricStat label="Total credentials" value={analytics.data.totalCredentials} accent hint="Minted and active through the credential contract." />
        <MetricStat label="Personal data on-chain" value="0 bytes" hint="The privacy claim is a product pillar, not a marketing line." />
        <MetricStat label="Attesters" value={attesters.data.attesters.length} hint="Stake-backed entities currently visible through the registry." />
        <MetricStat label="Revocations" value={analytics.data.revocationStats.length} hint="Revocation pathways are visible even when dormant." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Credential distribution</p>
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={credentialDistribution}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DoubleBezelCard>
        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Risk distribution</p>
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" fill="#7DD3FC" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DoubleBezelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-kicker">Attester registry</p>
                <h3 className="mt-3 text-2xl font-medium tracking-tight">Approved issuers and current issuance posture</h3>
              </div>
              <StatusPill status="info">Stake-backed</StatusPill>
            </div>
            <div className="mt-8 space-y-3">
              {attesters.data.attesters.map((attester) => (
                <div key={attester.attester} className="grid gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{attester.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--color-content-muted)]">{attester.attester}</p>
                  </div>
                  <div>
                    <p className="text-kicker">Issued</p>
                    <p className="mt-2 font-mono text-sm">{attester.credentialsIssued}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-kicker">Stake</p>
                      <p className="mt-2 font-mono text-sm">{formatNumber(Number(attester.stake) / 1e18)} HSK</p>
                    </div>
                    <StatusPill status={attester.approved ? "success" : "neutral"}>
                      {attester.approved ? "Approved" : "Pending"}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DoubleBezelCard>

        <DoubleBezelCard>
          <div className="surface-pad-sm">
            <p className="text-kicker">Issuance velocity</p>
            <h3 className="mt-3 text-2xl font-medium tracking-tight">Activity remains aggregate, legible, and regulator-safe.</h3>
            <div className="mt-8 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={issuanceCurve}>
                  <defs>
                    <linearGradient id="issuanceArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A4AFBF", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Area dataKey="value" stroke="#10B981" fill="url(#issuanceArea)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <MetricStat label="Risk samples" value={analytics.data.riskDistribution.length} />
              <MetricStat label="Revocation reasons" value={analytics.data.revocationStats.length} />
              <MetricStat label="Active products" value={analytics.data.activeProtocols} />
            </div>
          </div>
        </DoubleBezelCard>
      </div>
    </div>
  );
}
