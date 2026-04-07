import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  centreName?: string;
  userLabel?: string;
  subscriptionLabel?: string;
  roleLabel?: string | null;
  branchLabel?: string | null;
};

export function Header({
  centreName = "Teacher's Desk",
  subscriptionLabel = "Trial",
  roleLabel,
  branchLabel,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{centreName}</p>
          <p className="text-xs text-muted-foreground">
            {[roleLabel, branchLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        {subscriptionLabel && (
          <span className="hidden rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-700 ring-1 ring-sky-200 sm:inline-flex">
            {subscriptionLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Billing
          </Button>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e,#0284c7)] text-white shadow-[0_8px_20px_rgba(14,116,144,0.28)] ring-2 ring-white/80">
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
