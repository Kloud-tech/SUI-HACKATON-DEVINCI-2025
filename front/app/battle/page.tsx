'use client';

import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SiteHeader } from '@/components/SiteHeader';
import { useWalletMonsters } from '@/src/hooks/useWalletMonsters';
import { useBattleEvents } from '@/src/hooks/useBattleEvents';
import { buildRequestBattleTx } from '@/src/lib/buildRequestBattleTx';
import clsx from 'clsx';
import Image from 'next/image';

const RARITY_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-gray-500/20', border: 'border-gray-400/50', text: 'text-gray-300' },
  2: { bg: 'bg-blue-500/20', border: 'border-blue-400/50', text: 'text-blue-300' },
  3: { bg: 'bg-purple-500/20', border: 'border-purple-400/50', text: 'text-purple-300' },
  4: { bg: 'bg-yellow-500/20', border: 'border-yellow-400/50', text: 'text-yellow-300' },
};

export default function BattlePage() {
  const account = useCurrentAccount();
  const { monsters, isLoading: monstersLoading, refetch: refetchMonsters } = useWalletMonsters();
  const { events, refetch: refetchEvents } = useBattleEvents(10);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [selectedMonster1, setSelectedMonster1] = useState<string | null>(null);
  const [selectedMonster2, setSelectedMonster2] = useState<string | null>(null);
  const [battleStatus, setBattleStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const handleRequestBattle = async () => {
    if (!account) {
      setBattleStatus('error');
      setMessage('Connect your wallet first.');
      return;
    }
    if (!selectedMonster1 || !selectedMonster2) {
      setBattleStatus('error');
      setMessage('Select two monsters to battle.');
      return;
    }
    if (selectedMonster1 === selectedMonster2) {
      setBattleStatus('error');
      setMessage('Cannot battle the same monster.');
      return;
    }

    setBattleStatus('pending');
    setMessage('Requesting battle on-chain...');
    setTxDigest(null);

    try {
      const tx = buildRequestBattleTx(selectedMonster1, selectedMonster2);
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      const digest = 'digest' in result ? result.digest : undefined;

      if (!digest) {
        throw new Error('Transaction digest missing.');
      }

      setBattleStatus('success');
      setMessage('Battle requested! The TEE Docker will process it shortly.');
      setTxDigest(digest);

      // Rafraîchir les événements après 5s
      setTimeout(() => {
        refetchEvents();
        refetchMonsters();
      }, 5000);
    } catch (error) {
      setBattleStatus('error');
      setMessage(error instanceof Error ? error.message : 'Battle request failed.');
    }
  };

  const monster1 = monsters.find((m) => m.id === selectedMonster1);
  const monster2 = monsters.find((m) => m.id === selectedMonster2);

  return (
    <div className="min-h-screen bg-[#131022] text-white">
      <SiteHeader variant="glass" className="sticky top-6 z-50 mt-6" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            TEE Battle Arena
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Request a Battle</h1>
          <p className="mx-auto max-w-2xl text-base text-gray-300">
            Select two of your monsters to engage in combat. The battle will be processed by a Trusted Execution
            Environment (TEE) running in Docker, ensuring fair and verifiable results.
          </p>
        </section>

        {/* Monster Selection Grid */}
        <section className="rounded-[32px] border border-white/10 bg-[#0f0c1b]/70 p-6">
          <h2 className="mb-4 text-2xl font-bold">Your Monsters</h2>
          {!account && (
            <p className="text-sm text-white/70">Connect your wallet to see your monsters.</p>
          )}
          {account && monstersLoading && (
            <p className="text-sm text-white/70">Loading monsters...</p>
          )}
          {account && !monstersLoading && monsters.length === 0 && (
            <p className="text-sm text-white/70">
              No monsters found. Mint eggs and hatch them first!
            </p>
          )}
          {account && !monstersLoading && monsters.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {monsters.map((monster) => {
                const isSelected1 = selectedMonster1 === monster.id;
                const isSelected2 = selectedMonster2 === monster.id;
                const isSelected = isSelected1 || isSelected2;
                const colors = RARITY_COLORS[monster.rarity] ?? RARITY_COLORS[1];

                return (
                  <button
                    key={monster.id}
                    type="button"
                    onClick={() => {
                      if (isSelected1) {
                        setSelectedMonster1(null);
                      } else if (isSelected2) {
                        setSelectedMonster2(null);
                      } else if (!selectedMonster1) {
                        setSelectedMonster1(monster.id);
                      } else if (!selectedMonster2) {
                        setSelectedMonster2(monster.id);
                      }
                    }}
                    className={clsx(
                      'group relative rounded-2xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-[#330df2] bg-[#330df2]/10 scale-105'
                        : 'border-white/10 bg-white/5 hover:border-white/30',
                    )}
                  >
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#330df2] text-xs font-bold">
                        {isSelected1 ? '1' : '2'}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className={clsx('rounded-lg px-2 py-1 text-xs font-semibold', colors.bg, colors.text)}>
                        Lv {monster.level} · Rarity {monster.rarity}
                      </div>
                      <h3 className="text-lg font-bold">{monster.name}</h3>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-white/50">STR</span>
                          <p className="font-semibold">{monster.strength}</p>
                        </div>
                        <div>
                          <span className="text-white/50">AGI</span>
                          <p className="font-semibold">{monster.agility}</p>
                        </div>
                        <div>
                          <span className="text-white/50">INT</span>
                          <p className="font-semibold">{monster.intelligence}</p>
                        </div>
                      </div>
                      <div className="text-xs text-white/50">XP: {monster.experience}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Battle Preview */}
        {(monster1 || monster2) && (
          <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#330df2]/20 via-[#0f0c1b]/70 to-transparent p-6">
            <h2 className="mb-4 text-2xl font-bold">Battle Preview</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Monster 1 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                {monster1 ? (
                  <>
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/50">Fighter 1</p>
                    <h3 className="text-xl font-bold">{monster1.name}</h3>
                    <p className="text-sm text-white/70">Level {monster1.level}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-white/50">STR</span>
                        <p className="font-semibold">{monster1.strength}</p>
                      </div>
                      <div>
                        <span className="text-white/50">AGI</span>
                        <p className="font-semibold">{monster1.agility}</p>
                      </div>
                      <div>
                        <span className="text-white/50">INT</span>
                        <p className="font-semibold">{monster1.intelligence}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/50">Select Monster 1</p>
                )}
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="rounded-full border-2 border-[#330df2] bg-[#330df2]/20 px-6 py-3 text-2xl font-black">
                  VS
                </div>
              </div>

              {/* Monster 2 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                {monster2 ? (
                  <>
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/50">Fighter 2</p>
                    <h3 className="text-xl font-bold">{monster2.name}</h3>
                    <p className="text-sm text-white/70">Level {monster2.level}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-white/50">STR</span>
                        <p className="font-semibold">{monster2.strength}</p>
                      </div>
                      <div>
                        <span className="text-white/50">AGI</span>
                        <p className="font-semibold">{monster2.agility}</p>
                      </div>
                      <div>
                        <span className="text-white/50">INT</span>
                        <p className="font-semibold">{monster2.intelligence}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/50">Select Monster 2</p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleRequestBattle}
                disabled={!monster1 || !monster2 || battleStatus === 'pending'}
                className={clsx(
                  'w-full rounded-xl px-6 py-4 text-base font-semibold transition',
                  !monster1 || !monster2 || battleStatus === 'pending'
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-[#330df2] text-white hover:bg-[#4a3bff]',
                )}
              >
                {battleStatus === 'pending' ? 'Requesting Battle...' : 'Request Battle (On-Chain)'}
              </button>

              {battleStatus === 'success' && txDigest && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
                  <p className="font-semibold text-green-300">✅ {message}</p>
                  <a
                    href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-green-400 underline"
                  >
                    View transaction on Sui Explorer
                  </a>
                  <p className="mt-2 text-xs text-white/70">
                    Check Docker logs to see the TEE processing this battle:
                    <code className="ml-1 rounded bg-black/30 px-1 py-0.5">
                      docker-compose logs -f battle-listener
                    </code>
                  </p>
                </div>
              )}

              {battleStatus === 'pending' && (
                <p className="text-center text-sm text-white/70">{message}</p>
              )}

              {battleStatus === 'error' && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                  ❌ {message}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recent Battles */}
        <section className="rounded-[32px] border border-white/10 bg-[#0f0c1b]/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Battles</h2>
            <button
              onClick={() => refetchEvents()}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
          {events.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <p className="text-white/70">No battles recorded yet.</p>
              <p className="mt-2 text-sm text-white/50">Request a battle above to see results here!</p>
            </div>
          )}
          {events.length > 0 && (
            <div className="space-y-3">
              {events.map((event, idx) => {
                const winner = monsters.find((m) => m.id === event.winnerId);
                const loser = monsters.find((m) => m.id === event.loserId);
                const winnerName = winner?.name || `#${event.winnerId.slice(-4)}`;
                const loserName = loser?.name || `#${event.loserId.slice(-4)}`;
                
                return (
                  <div
                    key={`${event.txDigest}-${idx}`}
                    className="rounded-xl border border-white/10 bg-gradient-to-r from-green-500/10 via-[#330df2]/10 to-transparent p-4 transition hover:border-white/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                            Battle #{event.requestId}
                          </p>
                          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                            +{event.xpGained} XP
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Winner Section */}
                          <div className="flex flex-1 items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                            <span className="text-3xl">🏆</span>
                            <div className="flex-1">
                              <p className="text-xs font-medium uppercase tracking-wider text-green-400/70">
                                Winner
                              </p>
                              <p className="text-lg font-bold text-green-300">{winnerName}</p>
                              {winner && (
                                <div className="mt-1 flex gap-2 text-xs text-white/60">
                                  <span>STR: {winner.strength}</span>
                                  <span>AGI: {winner.agility}</span>
                                  <span>INT: {winner.intelligence}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-2xl font-bold text-white/30">VS</span>

                          {/* Loser Section */}
                          <div className="flex flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                            <span className="text-3xl opacity-40">💀</span>
                            <div className="flex-1">
                              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Loser
                              </p>
                              <p className="text-lg font-semibold text-white/60">{loserName}</p>
                              {loser && (
                                <div className="mt-1 flex gap-2 text-xs text-white/40">
                                  <span>STR: {loser.strength}</span>
                                  <span>AGI: {loser.agility}</span>
                                  <span>INT: {loser.intelligence}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span>
                            {new Date(event.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <a
                            href={`https://suiexplorer.com/txblock/${event.txDigest}?network=testnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#8b7bff] transition hover:text-[#a89fff]"
                          >
                            View TX →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
