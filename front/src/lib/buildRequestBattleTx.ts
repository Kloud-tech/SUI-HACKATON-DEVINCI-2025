// src/lib/buildRequestBattleTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, BATTLE_CONFIG_ID } from '../config/chimera';

/**
 * Construit une transaction pour demander un combat entre deux monstres.
 * Ceci émettra un événement BattleRequest que le TEE Docker écoutera.
 */
export function buildRequestBattleTx(monster1Id: string, monster2Id: string) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::monster_battle::request_battle`,
    arguments: [
      tx.object(BATTLE_CONFIG_ID),
      tx.object(monster1Id),
      tx.object(monster2Id),
    ],
  });

  return tx;
}
