'use client';

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useConnectWallet,
  useWallets,
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
  txDigest: string;
  rarity: number;
};

const RARITIES = [0, 1, 2, 3] as const;

export default function Home() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Hooks pour la connexion wallet
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();

  // UI state
  const [lastMint, setLastMint] = useState<MintedEgg | null>(null);
  const [loadingRarity, setLoadingRarity] = useState<number | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleBuy = async (rarity: number) => {
    console.log('handleBuy click', { rarity, account });

    // Si pas connecté -> on ouvre la modale de connexion au lieu d'un alert
    if (!account) {
      setShowConnectModal(true);
      return;
    }

    try {
      setLoadingRarity(rarity);

      const tx = buildBuyEggTx(rarity);
      console.log('Built tx', tx);

      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui:testnet',
      });

      console.log('Tx executed', result);

      setLastMint({
        txDigest: result.digest,
        rarity,
      });
    } catch (e) {
      console.error('Buy egg failed', e);
      alert(
        "Transaction failed. Ouvre la console du navigateur (F12 > Console) pour voir l'erreur.",
      );
    } finally {
      setLoadingRarity(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden font-sans">
      {/* Background animé léger */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg rotate-12 animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg -rotate-12 animate-pulse delay-500" />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main */}
      <main className="flex-1 flex flex-col pt-32 relative z-10">
        <div className="container mx-auto px-6 py-16">
    {/* Hero Section */}
      <div className="text-center mb-16 max-w-4xl mx-auto flex flex-col items-center gap-3">
        <h1
          className="
            text-4xl md:text-5xl lg:text-6xl
            font-black font-bangers tracking-wide
            bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400
            text-transparent bg-clip-text
            drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]
            transition-transform duration-300
            hover:scale-[1.02] hover:drop-shadow-[0_0_22px_rgba(56,189,248,0.55)]
          "
  >
    Choose your egg and join the adventure!
  </h1>

  <p className="text-sm md:text-base text-muted-foreground">
    Mint an egg, reveal its hidden stats and prepare it for battle on Sui.
  </p>
</div>

          {/* Grid des œufs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {RARITIES.map((r) => (
              <div key={r} className="group relative flex flex-col">
                {/* Carte cliquable */}
                <div
                  className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:scale-110 hover:rotate-3 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-cyan-500/30 border-4 border-gray-200 hover:border-pink-400 flex items-center justify-center relative"
                  onClick={() => handleBuy(r)}
                >
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

          {/* Résumé de la dernière tx */}
          {lastMint && (
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 border-4 border-cyan-200 shadow-2xl shadow-cyan-500/30">
                <h3 className="text-4xl font-black mb-4 text-center bg-gradient-to-r from-cyan-600 to-blue-600 text-transparent bg-clip-text font-bangers tracking-wide">
                  Transaction envoyée ! ✨
                </h3>
                <p className="text-2xl font-bold text-gray-700 mb-2 text-center font-bangers tracking-wide">
                  Rareté : {RARITY_LABELS[lastMint.rarity]}
                </p>
                <p className="text-sm text-gray-600 break-words text-center font-mono">
                  Tx digest : {lastMint.txDigest}
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

      {/* 🔌 Modale de connexion wallet quand on clique sur un œuf sans être connecté */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
            <h2 className="text-2xl font-bangers tracking-wide mb-2 text-center">
              Connecte ton wallet 🧪
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Choisis un wallet pour acheter ton œuf sur Sui.
            </p>

            <div className="space-y-2 mb-4">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => {
                    connectWallet({ wallet });
                    setShowConnectModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors font-medium"
                >
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{wallet.name}</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => setShowConnectModal(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
