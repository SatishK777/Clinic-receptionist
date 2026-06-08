'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import QueryProvider from '../components/QueryProvider.js';
import './globals.css';

export default function RootLayout({ children }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <title>AI Voice Receptionist | Operating System for Clinics</title>
        <meta
          name="description"
          content="Multi-tenant AI Voice Receptionist Dashboard and management console for USA Healthcare clinics and hospitals."
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
