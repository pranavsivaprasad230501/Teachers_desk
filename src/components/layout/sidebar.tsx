'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Settings,
  BookOpen,
  Bell,
  Calendar,
  GraduationCap,
  AlertTriangle,
  Building2,
  UserCog,
} from 'lucide-react';
import type { StaffRole } from '@/lib/types';

const ownerRoutes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-400' },
  { label: 'Batches', icon: BookOpen, href: '/dashboard/batches', color: 'text-violet-400' },
  { label: 'Students', icon: Users, href: '/dashboard/students', color: 'text-pink-400' },
  { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/attendance', color: 'text-orange-400' },
  { label: 'Fees', icon: CreditCard, href: '/dashboard/fees', color: 'text-emerald-400' },
  { label: 'Timetable', icon: Calendar, href: '/dashboard/timetable', color: 'text-cyan-400' },
  { label: 'Tests', icon: GraduationCap, href: '/dashboard/tests', color: 'text-indigo-400' },
  { label: 'Alerts', icon: AlertTriangle, href: '/dashboard/alerts', color: 'text-red-400' },
  { label: 'Messages', icon: Bell, href: '/dashboard/messages', color: 'text-amber-400' },
  { label: 'Branches', icon: Building2, href: '/dashboard/branches', color: 'text-lime-400' },
  { label: 'Staff', icon: UserCog, href: '/dashboard/staff', color: 'text-fuchsia-400' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: 'text-slate-400' },
];

const teacherRoutes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-400' },
  { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/attendance', color: 'text-orange-400' },
  { label: 'Timetable', icon: Calendar, href: '/dashboard/timetable', color: 'text-cyan-400' },
  { label: 'Tests', icon: GraduationCap, href: '/dashboard/tests', color: 'text-indigo-400' },
];

export const Sidebar = ({ role = 'owner' }: { role?: StaffRole | null }) => {
  const pathname = usePathname();
  const routes = role === 'teacher' ? teacherRoutes : ownerRoutes;

  return (
    <div className="flex h-full flex-col border-r border-white/5 bg-[linear-gradient(180deg,#0d1526_0%,#111827_50%,#0d1526_100%)] text-white">
      <div className="px-3 pb-4 pt-5">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 shadow-[0_6px_18px_rgba(14,165,233,0.4)]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Centre<span className="text-sky-400">+</span>
          </h1>
        </Link>
        <nav className="space-y-0.5">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                href={route.href}
                key={route.href}
                className={cn(
                  "group flex w-full cursor-pointer items-center rounded-lg p-3 text-sm font-medium transition",
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_2px_0_0_theme(colors.sky.400)]"
                    : "text-slate-400 hover:bg-white/7 hover:text-white"
                )}
              >
                <route.icon
                  className={cn(
                    "mr-3 h-4 w-4 shrink-0 transition",
                    isActive ? route.color : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {route.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
