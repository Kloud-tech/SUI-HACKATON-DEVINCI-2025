// src/lib/buildBuyEggTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SUI_PACKAGE_ID, EGG_PRICES_MIST } from '../config/sui';

export function buildBuyEggTx(rarity: number) {
  const tx = new Transaction();

  const price = EGG_PRICES_MIST[rarity];
  if (price === undefined) {
    throw new Error(`Invalid rarity: ${rarity}`);
  }

  // EGG_PRICES_MIST est en bigint, Transaction attend un number pour u64
  const priceNumber = Number(price);

  // On split la gas coin pour créer la coin "payment" avec le bon montant
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceNumber)]);

  // Appel de ta fonction Move: eggs::buy_egg(rarity: u8, payment: Coin<SUI>)
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::eggs::buy_egg`,
    arguments: [
      tx.pure.u8(rarity), // rarity en u8
      payment,            // Coin<SUI>
    ],
  });

  return tx;
}
