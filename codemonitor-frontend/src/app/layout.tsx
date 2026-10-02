import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'IdeaX CodeMonitor | Hackathon Audit Dashboard',
  description: 'IdeaX 2026 hackathon development monitoring and audit dashboard for organizers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F2F6FF] text-[#1F2937]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
