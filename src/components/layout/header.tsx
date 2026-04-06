import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type HeaderProps = {
  centreName?: string;
  userLabel?: string;
  subscriptionLabel?: string;
  roleLabel?: string | null;
  branchLabel?: string | null;
};

export function Header({
  centreName = "Centre+",
  userLabel = "Owner",
  subscriptionLabel = "Trial",
  roleLabel,
  branchLabel,
}: HeaderProps) {
  const initials = userLabel
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-sky-500 to-teal-500 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
