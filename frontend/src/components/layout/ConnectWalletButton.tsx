import { ArrowSquareOut, PlugsConnected, SignOut } from "@phosphor-icons/react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { activeChain } from "@/lib/config";
import { shortAddress } from "@/lib/utils";

export function ConnectWalletButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <MagneticButton
        className="min-h-11 px-4 sm:px-6"
        onClick={() => connect({ connector: injected })}
        disabled={!injected || isPending}
        icon={<ArrowSquareOut size={16} weight="bold" />}
      >
        {isPending ? (
          <>
            <span className="sm:hidden">Connecting</span>
            <span className="hidden sm:inline">Connecting wallet</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        )}
      </MagneticButton>
    );
  }

  if (chainId !== activeChain.id) {
    return (
      <MagneticButton
        className="min-h-11 px-4 sm:px-6"
        variant="secondary"
        onClick={() => switchChain({ chainId: activeChain.id })}
        icon={<PlugsConnected size={16} weight="bold" />}
      >
        <span className="sm:hidden">Switch</span>
        <span className="hidden sm:inline">Switch network</span>
      </MagneticButton>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 md:block">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-content-muted)]">Wallet</p>
        <p className="mt-1 text-sm font-medium text-[var(--color-content-primary)]">{shortAddress(address)}</p>
      </div>
      <MagneticButton className="min-h-11 px-4 sm:px-6" variant="ghost" onClick={() => disconnect()} icon={<SignOut size={16} weight="bold" />}>
        <span className="sm:hidden">Exit</span>
        <span className="hidden sm:inline">Disconnect</span>
      </MagneticButton>
    </div>
  );
}
