// src/hooks/useWalletMonsters.ts

import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../config/chimera';

export interface Monster {
  id: string;
  name: string;
  level: number;
  experience: number;
  strength: number;
  agility: number;
  intelligence: number;
  rarity: number;
}

/**
 * Hook pour récupérer tous les monstres appartenant au wallet connecté
 */
export function useWalletMonsters() {
  const account = useCurrentAccount();

  const { data, isLoading, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address ?? '',
      filter: {
        StructType: `${PACKAGE_ID}::monster_hatchery::Monster`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account?.address,
      refetchInterval: 10000, // Rafraîchir toutes les 10s
    },
  );

  const monsters: Monster[] =
    data?.data
      .map((obj) => {
        if (
          obj.data?.content &&
          'dataType' in obj.data.content &&
          obj.data.content.dataType === 'moveObject' &&
          'fields' in obj.data.content
        ) {
          const fields = obj.data.content.fields as Record<string, unknown>;
          return {
            id: obj.data.objectId,
            name: String(fields.name ?? 'Unknown'),
            level: Number(fields.level ?? 1),
            experience: Number(fields.experience ?? 0),
            strength: Number(fields.strength ?? 0),
            agility: Number(fields.agility ?? 0),
            intelligence: Number(fields.intelligence ?? 0),
            rarity: Number(fields.rarity ?? 1),
          };
        }
        return null;
      })
      .filter((m): m is Monster => m !== null) ?? [];

  return {
    monsters,
    isLoading,
    error,
    refetch,
  };
}
