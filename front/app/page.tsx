'use client';

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BlurText from '@/components/BlurText';
import { Navbar } from '@/components/Navbar';
import { ProjectInfo } from '@/components/ProjectInfo';
import Image from 'next/image';
import {
  RARITY_LABELS,
  RARITY_IMAGES,
  EGG_PRICES_MIST,
} from '../src/config/sui';
import { buildBuyEggTx } from '../src/lib/buildBuyEggTx';


type MintedEgg = {
  objectId: string;
  rarity: number;
};

const RARITIES = [0, 1, 2, 3] as const;

export default function Home() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [lastMint, setLastMint] = useState<MintedEgg | null>(null);
  const [loadingRarity, setLoadingRarity] = useState<number | null>(null);

  const handleBuy = async (rarity: number) => {
    // Pas de wallet connecté → on demande d'utiliser le bouton du header
    if (!account) {
      alert("Connecte ton wallet avec le bouton en haut à droite 🙂");
      return;
    }

    try {
      setLoadingRarity(rarity);

      // Construire la transaction Move pour eggs::buy_egg
      const tx = buildBuyEggTx(rarity);

      // Envoyer la transaction au wallet (Slush va ouvrir la pop-up de signature)
      const result: any = await signAndExecute({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      // Chercher l'EggNFT créé dans les objectChanges
      const created = result?.objectChanges?.find(
        (c: any) =>
          c.type === 'created' &&
          typeof c.objectType === 'string' &&
          c.objectType.includes('::eggs::EggNFT'),
      );

      if (created) {
        setLastMint({
          objectId: created.objectId,
          rarity,
        });
      } else {
        console.warn('EggNFT non trouvé dans objectChanges', result);
      }
    } catch (e) {
      console.error('Buy egg failed', e);
      alert('Transaction failed, check console');
    } finally {
      setLoadingRarity(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden font-sans">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg rotate-12 animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg -rotate-12 animate-pulse delay-500" />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-32 relative z-10">
        <div className="container mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16 max-w-4xl mx-auto flex justify-center">
            <BlurText
              text="Hatch, Discover & Evolve"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-balance leading-tight bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 text-transparent bg-clip-text font-bangers tracking-wide"
            />
          </div>

          {/* Egg Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {RARITIES.map((r) => (
              <div key={r} className="group relative flex flex-col">
                <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:scale-110 hover:rotate-3 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-cyan-500/30 border-4 border-gray-200 hover:border-pink-400 flex items-center justify-center relative">
                  <Image
                    src={RARITY_IMAGES[r]}
                    alt={RARITY_LABELS[r]}
                    fill
                    className="object-contain p-8"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-black mb-2 text-gray-700 font-bangers tracking-wider">
                    {RARITY_LABELS[r]}
                  </p>
                  <p className="text-3xl font-black text-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)] mb-4 font-bangers tracking-widest">
                    {Number(EGG_PRICES_MIST[r]) / 1_000_000_000} SUI
                  </p>
                  <Button
                    onClick={() => handleBuy(r)}
                    disabled={loadingRarity === r}
                    size="lg"
                    className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold shadow-lg shadow-cyan-500/50 font-bangers text-xl tracking-wide"
                  >
                    {loadingRarity === r ? 'Buying...' : 'Buy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Last Mint Display */}
          {lastMint && (
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 border-4 border-cyan-200 shadow-2xl shadow-cyan-500/30">
                <h3 className="text-4xl font-black mb-4 text-center bg-gradient-to-r from-cyan-600 to-blue-600 text-transparent bg-clip-text font-bangers tracking-wide">
                  Ton œuf a éclos ! ✨
                </h3>
                <div className="flex items-center justify-center mb-4 relative w-32 h-32 mx-auto">
                  <Image
                    src={RARITY_IMAGES[lastMint.rarity]}
                    alt={RARITY_LABELS[lastMint.rarity]}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-2 text-center font-bangers tracking-wide">
                  Rareté : {RARITY_LABELS[lastMint.rarity]}
                </p>
                <p className="text-sm text-gray-600 break-words text-center font-mono">
                  Object ID : {lastMint.objectId}
                </p>
              </div>
            </div>
          )}
        </div>

        <ProjectInfo />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 Evolving Eggs Collection. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
