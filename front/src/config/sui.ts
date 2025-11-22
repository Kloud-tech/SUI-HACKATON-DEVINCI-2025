export const SUI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ??
  '0xd410613c61e0cc0be8b4fc588e96334232d7377f975b2465237e4296af62705e';

export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL ?? 'https://fullnode.testnet.sui.io:443';

export const EGG_PRICES_MIST: Record<number, bigint> = {
  0: 100_000_000n,
  1: 500_000_000n,
  2: 1_000_000_000n,
  3: 2_000_000_000n,
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

export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? 'enoki_public_...'; // Replace with your actual Enoki Public Key
