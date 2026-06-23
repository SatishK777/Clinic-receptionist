'use client';

import QueryProvider from './QueryProvider.js';
import AuthBootstrap from './AuthBootstrap.js';

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthBootstrap />
      {children}
    </QueryProvider>
  );
}
