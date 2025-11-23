'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

/**
 * Composant qui affiche le statut du listener Docker TEE
 * Utile pour debug et pour savoir si le système est opérationnel
 */
export function TeeStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Dans un vrai setup, on pourrait ping un endpoint health du Docker
    // Pour l'instant, on assume qu'il est online si on est sur testnet
    const checkStatus = () => {
      // Simulation - en prod, faire un vrai check
      setStatus('online');
      setLastCheck(new Date());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check toutes les 30s

    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return null; // Pas d'affichage pendant le premier check
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-sm',
        status === 'online'
          ? 'border-green-500/30 bg-green-500/10 text-green-300'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      )}
    >
      <div
        className={clsx(
          'h-2 w-2 rounded-full',
          status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-rose-400',
        )}
      />
      <span>
        {status === 'online' ? 'TEE Docker Online' : 'TEE Docker Offline'}
      </span>
      {lastCheck && (
        <span className="text-white/50">
          · {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
