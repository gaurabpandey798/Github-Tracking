'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  GitFork,
  UserCheck,
  Timer,
  Flag,
  GitCommit,
  ShieldAlert,
  Activity,
  ScrollText,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isComingSoon?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Participants', href: '/participants', icon: Contact },
  { name: 'Repositories', href: '/repositories', icon: GitFork },
  { name: 'Developers', href: '/developers', icon: UserCheck },
  { name: 'Sprints', href: '/sprints', icon: Timer },
  { name: 'Checkpoints', href: '/checkpoints', icon: Flag },
  { name: 'Commits', href: '/commits', icon: GitCommit },
  { name: 'Review Center', href: '/review-center', icon: ShieldAlert },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', href: '/settings', icon: Settings, isComingSoon: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isCurrentActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B2560] text-white font-bold text-sm tracking-wider">
            IX
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1B2560] leading-none">
              IdeaX CodeMonitor
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Hackathon 2026 Audit
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#F2F6FF] text-[#1B2560] font-semibold border-l-4 border-[#1B2560]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      active ? 'text-[#1B2560]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.isComingSoon && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 uppercase">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              API Port 8085
            </span>
            <span className="font-mono text-[10px] text-slate-400">v1.0-mvp</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Basic Auth • admin:admin123
          </p>
        </div>
      </aside>
    </>
  );
}
