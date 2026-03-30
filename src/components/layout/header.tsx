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
    <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-900">{centreName}</p>
        <p className="text-xs text-muted-foreground">
          {[roleLabel, branchLabel, subscriptionLabel].filter(Boolean).join(" · ")}
        </p>
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
