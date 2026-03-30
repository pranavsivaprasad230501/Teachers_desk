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
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-500' },
  { label: 'Batches', icon: BookOpen, href: '/dashboard/batches', color: 'text-violet-500' },
  { label: 'Students', icon: Users, href: '/dashboard/students', color: 'text-pink-700' },
  { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/attendance', color: 'text-orange-700' },
  { label: 'Fees', icon: CreditCard, href: '/dashboard/fees', color: 'text-emerald-500' },
  { label: 'Timetable', icon: Calendar, href: '/dashboard/timetable', color: 'text-cyan-500' },
  { label: 'Tests', icon: GraduationCap, href: '/dashboard/tests', color: 'text-indigo-500' },
  { label: 'Alerts', icon: AlertTriangle, href: '/dashboard/alerts', color: 'text-red-500' },
  { label: 'Messages', icon: Bell, href: '/dashboard/messages', color: 'text-amber-500' },
  { label: 'Branches', icon: Building2, href: '/dashboard/branches', color: 'text-lime-500' },
  { label: 'Staff', icon: UserCog, href: '/dashboard/staff', color: 'text-fuchsia-500' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: 'text-gray-500' },
];

const teacherRoutes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-500' },
  { label: 'Attendance', icon: CalendarCheck, href: '/dashboard/attendance', color: 'text-orange-700' },
  { label: 'Timetable', icon: Calendar, href: '/dashboard/timetable', color: 'text-cyan-500' },
  { label: 'Tests', icon: GraduationCap, href: '/dashboard/tests', color: 'text-indigo-500' },
];

export const Sidebar = ({ role = 'owner' }: { role?: StaffRole | null }) => {
  const pathname = usePathname();
  const routes = role === 'teacher' ? teacherRoutes : ownerRoutes;

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-8 h-8 mr-4 bg-white rounded-full flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Centre<span className="text-sky-500">+</span>
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
