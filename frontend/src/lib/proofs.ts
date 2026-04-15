import { Group } from "@semaphore-protocol/group";
import type { Identity } from "@semaphore-protocol/identity";
import { generateProof } from "@semaphore-protocol/proof";
import deployedAddresses from "@/lib/deployedAddresses.json";
import { getGroupId, publicClient } from "@/lib/onchain";

const memberAddedEvent = {
  type: "event",
  name: "MemberAdded",
  inputs: [
    { indexed: true, name: "groupId", type: "uint256" },
    { indexed: false, name: "index", type: "uint256" },
    { indexed: false, name: "identityCommitment", type: "uint256" },
    { indexed: false, name: "merkleTreeRoot", type: "uint256" },
  ],
} as const;

const membersAddedEvent = {
  type: "event",
  name: "MembersAdded",
  inputs: [
    { indexed: true, name: "groupId", type: "uint256" },
    { indexed: false, name: "startIndex", type: "uint256" },
    { indexed: false, name: "identityCommitments", type: "uint256[]" },
    { indexed: false, name: "merkleTreeRoot", type: "uint256" },
  ],
} as const;

const GROUP_LOG_LOOKBACK_BLOCKS = deployedAddresses.chainId === 133 ? 50_000n : 0n;

export async function fetchGroupMembers(groupId: bigint) {
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock =
    GROUP_LOG_LOOKBACK_BLOCKS === 0n || latestBlock <= GROUP_LOG_LOOKBACK_BLOCKS
      ? 0n
      : latestBlock - GROUP_LOG_LOOKBACK_BLOCKS;

  const [singleMemberLogs, batchedMemberLogs] = await Promise.all([
    publicClient.getLogs({
      address: deployedAddresses.semaphore as `0x${string}`,
      event: memberAddedEvent,
      args: { groupId },
      fromBlock,
    }),
    publicClient.getLogs({
      address: deployedAddresses.semaphore as `0x${string}`,
      event: membersAddedEvent,
      args: { groupId },
      fromBlock,
    }),
  ]);

  const allLogs = [
    ...singleMemberLogs.map((log) => ({ type: "single" as const, log })),
    ...batchedMemberLogs.map((log) => ({ type: "batch" as const, log })),
  ].sort((a, b) => {
    if (a.log.blockNumber === b.log.blockNumber) {
      return Number((a.log.logIndex ?? 0n) - (b.log.logIndex ?? 0n));
    }
    return Number((a.log.blockNumber ?? 0n) - (b.log.blockNumber ?? 0n));
  });

  return allLogs.flatMap((entry) =>
    entry.type === "single"
      ? [BigInt(entry.log.args.identityCommitment!)]
      : (entry.log.args.identityCommitments ?? []).map((commitment) => BigInt(commitment))
  );
}

export async function generateSemaphoreCredentialProof(identity: Identity, credentialType: number, walletAddress: string) {
  const groupId = await getGroupId(credentialType);
  const members = await fetchGroupMembers(groupId);
  const group = new Group(members);
  return generateProof(identity, group, BigInt(walletAddress), groupId, 20);
}
