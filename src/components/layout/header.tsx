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
  return (
    <div className="flex items-center justify-between border-b border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0b66c3,#0f766e)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(11,102,195,0.22)]">
          C+
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{centreName}</p>
          <p className="text-xs text-muted-foreground">
            {[roleLabel, branchLabel, subscriptionLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            Billing
          </Button>
        </Link>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-sky-600 text-xs font-medium text-white">
            {userLabel
              .split(" ")
              .map((chunk) => chunk[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
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
