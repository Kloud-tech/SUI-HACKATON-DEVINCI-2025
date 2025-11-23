// front/src/lib/buildBuyEggTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SUI_PACKAGE_ID, EGG_PRICES_MIST } from '../config/sui';

export function buildBuyEggTx(rarity: number) {
  const tx = new Transaction();

  const price = EGG_PRICES_MIST[rarity];
  if (price === undefined) {
    throw new Error(`Invalid rarity: ${rarity}`);
  }

  const priceNumber = Number(price);

  // On split le gas coin pour créer un Coin<SUI> "payment"
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceNumber)]);

  // public entry fun buy_egg(rarity: u8, payment: Coin<SUI>, ctx: &mut TxContext)
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::eggs::buy_egg`,
    arguments: [
      tx.pure.u8(rarity),
      payment,
      // TxContext est injecté automatiquement par Sui
    ],
  });

  return tx;
}
