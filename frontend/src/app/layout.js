import AppProviders from '../components/AppProviders.js';
import './globals.css';

export default function RootLayout({ children }) {
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
