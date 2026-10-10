import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'AgentBreak — Autonomous AI Red Team Dashboard',
  description: 'Autonomous discovery, reproducible attack tracing, and adaptive defense evaluation for AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '32px 24px 64px 24px',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
