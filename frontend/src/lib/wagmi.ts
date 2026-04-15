import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { activeChain } from "@/lib/config";

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: {
    [activeChain.id]: http(activeChain.rpcUrls.default.http[0]),
  },
});
