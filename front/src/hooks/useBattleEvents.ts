// src/hooks/useBattleEvents.ts

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../config/chimera';

export interface BattleEvent {
  requestId: string;
  winnerId: string;
  loserId: string;
  xpGained: string;
  timestamp: number;
  txDigest: string;
}

/**
 * Hook pour récupérer les événements de combat terminés
 */
export function useBattleEvents(limit = 20) {
  const { data, isLoading, error, refetch } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::monster_battle::BattleEvent`,
      },
      limit,
      order: 'descending',
    },
    {
      refetchInterval: 15000, // Rafraîchir toutes les 15s
    },
  );

  const events: BattleEvent[] =
    data?.data
      .map((event) => {
        if (event.parsedJson && typeof event.parsedJson === 'object') {
          const parsed = event.parsedJson as Record<string, unknown>;
          return {
            requestId: String(parsed.request_id ?? '0'),
            winnerId: String(parsed.winner_id ?? ''),
            loserId: String(parsed.loser_id ?? ''),
            xpGained: String(parsed.xp_gained ?? '0'),
            timestamp: event.timestampMs ? Number(event.timestampMs) : Date.now(),
            txDigest: event.id.txDigest,
          };
        }
        return null;
      })
      .filter((e): e is BattleEvent => e !== null) ?? [];

  return {
    events,
    isLoading,
    error,
    refetch,
  };
}
