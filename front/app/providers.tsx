'use client';

import { ReactNode } from 'react';
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit';
import { EnokiFlowProvider } from '@mysten/enoki/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUI_RPC_URL, ENOKI_API_KEY } from '../src/config/sui';
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
  testnet: { url: SUI_RPC_URL },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <EnokiFlowProvider apiKey={ENOKI_API_KEY}>
          <WalletProvider autoConnect>{children}</WalletProvider>
        </EnokiFlowProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
