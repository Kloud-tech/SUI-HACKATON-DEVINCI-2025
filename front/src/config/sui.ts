// front/src/config/sui.ts

// Package ID retourné par `sui client publish`.
// Tu peux l’overrider via .env si besoin.
export const SUI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ??
  '0xd410613c61e0cc0be8b4fc588e96334232d7377f975b2465237e4296af62705e';

export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL ?? 'https://fullnode.testnet.sui.io:443';

// Prix en MIST (1 SUI = 1_000_000_000 MIST)
export const EGG_PRICES_MIST: Record<number, bigint> = {
  0: 100_000_000n,   // 0.1 SUI (Common)
  1: 500_000_000n,   // 0.5 SUI (Rare)
  2: 1_000_000_000n, // 1 SUI (Epic)
  3: 2_000_000_000n, // 2 SUI (Legendary)
};

export const RARITY_LABELS: Record<number, string> = {
  0: 'Common',
  1: 'Rare',
  2: 'Epic',
  3: 'Legendary',
};

export const RARITY_IMAGES: Record<number, string> = {
  0: '/egg_commune.png',
  1: '/egg_rare.png',
  2: '/egg_epic.png',
  3: '/egg_legendary.png',
};

// Enoki (pour ton login ZK)
export const ENOKI_API_KEY =
  process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? 'enoki_public_...'; // à remplacer pour de vrai si besoin
