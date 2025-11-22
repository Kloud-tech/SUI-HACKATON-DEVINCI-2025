'use client';

import { useEnokiFlow } from '@mysten/enoki/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';

export function EnokiConnectButton() {
  const flow = useEnokiFlow();
  const account = useCurrentAccount();

  const handleConnect = async () => {
    try {
        // This will redirect to the Enoki login page (Google, etc.)
        await flow.login(); 
    } catch (error) {
        console.error("Enoki login failed", error);
    }
  };

  const handleDisconnect = () => {
      flow.logout();
  };

  if (account) {
    return (
      <Button variant="outline" onClick={handleDisconnect} className="gap-2 font-bangers tracking-wide">
        <LogOut className="w-4 h-4" />
        {account.address.slice(0, 6)}...{account.address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} className="gap-2 font-bangers tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <LogIn className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
