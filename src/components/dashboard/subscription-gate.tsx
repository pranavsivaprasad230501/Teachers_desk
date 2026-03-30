import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

type SubscriptionGateProps = {
  trialEndsAt?: string | null;
};

export function SubscriptionGate({ trialEndsAt }: SubscriptionGateProps) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Subscription required</CardTitle>
        <CardDescription>
          Your centre is outside the active access window. Resume billing to use attendance,
          student management, fee tracking, and the parent portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Trial end: {formatDate(trialEndsAt)}
        </div>
        <Link href="/dashboard/settings">
          <Button>Open Billing</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
