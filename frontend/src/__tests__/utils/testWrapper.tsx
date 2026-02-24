/**
 * Shared test wrappers for components that use Layout/Header (which uses usePublicFeatureFlag).
 * Header requires QueryClientProvider for feature flag hooks.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Prefill feature flags so Header/Layout render without API calls
  queryClient.setQueryData(['featureFlag', 'public', 'password_reset'], { data: { enabled: true } });
  queryClient.setQueryData(['featureFlag', 'public', 'registration'], { data: { enabled: true } });
  return queryClient;
};

/** Wrapper for pages that use Layout (e.g. Landing, policy pages) - includes QueryClient, Router, Auth */
export const createPageWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
