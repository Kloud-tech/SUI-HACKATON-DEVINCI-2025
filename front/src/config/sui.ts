export const SUI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ??
  '0xd410613c61e0cc0be8b4fc588e96334232d7377f975b2465237e4296af62705e';

export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL ?? 'https://fullnode.testnet.sui.io:443';

export type EggRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const EGG_RARITIES: readonly EggRarity[] = ['common', 'rare', 'epic', 'legendary'] as const;

export const HATCHERY_RARITY_CODE: Record<EggRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const EGG_PRICES_CIM: Record<EggRarity, bigint> = {
  common: 100n,
  rare: 500n,
  epic: 1_000n,
  legendary: 5_000n,
};

export const RARITY_LABELS: Record<EggRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

// Images des œufs depuis /public
export const RARITY_IMAGES: Record<EggRarity, string> = {
  common: '/egg_commune.png',
  rare: '/egg_rare.png',
  epic: '/egg_epic.png',
  legendary: '/egg_legendary.png',
};

export const MIST_PER_SUI = 1_000_000_000n;

export function formatMistToSui(value: bigint, fractionDigits = 2): string {
  const sui = Number(value) / Number(MIST_PER_SUI);
  return `${sui.toFixed(fractionDigits)} SUI`;
}

export function formatCim(amount: bigint): string {
  return `${amount.toString()} CIM`;
}
