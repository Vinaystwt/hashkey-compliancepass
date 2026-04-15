import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Fingerprint, List, ShieldCheck, X } from "@phosphor-icons/react";
import { ConnectWalletButton } from "@/components/layout/ConnectWalletButton";
import { cn } from "@/lib/utils";
import { activeChain, appConfig } from "@/lib/config";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/verify", label: "Verify" },
  { to: "/demo", label: "Demo" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/credential", label: "Credential" },
  { to: "/docs", label: "Docs" },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="premium-scrollbar min-h-[100dvh]">
      <header className="sticky top-0 z-40 px-4 py-5 md:px-6">
        <div className="double-bezel-shell mx-auto flex max-w-[1440px] items-center justify-between rounded-full px-3 py-3 backdrop-blur-xl">
          <div className="double-bezel-core flex w-full items-center justify-between gap-3 rounded-full px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <ShieldCheck size={22} weight="duotone" className="text-[var(--color-accent-success)]" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium tracking-tight text-[var(--color-content-primary)]">CompliancePass</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-content-muted)]">{appConfig.networkLabel}</p>
              </div>
            </div>
            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-2 text-sm text-[var(--color-content-secondary)] transition-all duration-300 hover:bg-white/[0.04] hover:text-[var(--color-content-primary)]",
                      isActive && "bg-white/[0.06] text-[var(--color-content-primary)]"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NavLink to="/docs" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] md:flex">
                <Fingerprint size={16} className="text-[var(--color-accent-info)]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-content-secondary)]">
                  {appConfig.networkMode === "local" ? "Network status" : "Testnet live"}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--color-content-primary)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] lg:hidden"
                aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              >
                {menuOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
              </button>
              <ConnectWalletButton />
            </div>
          </div>
        </div>
        <div
          className={cn(
            "mx-auto mt-3 max-w-[1440px] overflow-hidden transition-all duration-500 ease-[var(--bezier-premium)] lg:hidden",
            menuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="double-bezel-shell rounded-[2rem] p-2">
            <div className="double-bezel-core rounded-[calc(2rem-0.4rem)] p-4">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-[1.25rem] border border-transparent px-4 py-4 text-sm text-[var(--color-content-secondary)] transition-all duration-300",
                        isActive
                          ? "border-white/10 bg-white/[0.06] text-[var(--color-content-primary)]"
                          : "hover:border-white/10 hover:bg-white/[0.03] hover:text-[var(--color-content-primary)]"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="px-4 pb-20 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
