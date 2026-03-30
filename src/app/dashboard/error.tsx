"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { SetupRequired } from "@/components/dashboard/setup-required";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isMissingSchemaError } from "@/lib/supabase-errors";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  if (isMissingSchemaError(error)) {
    return <SetupRequired message={error.message} />;
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Dashboard error</CardTitle>
        <CardDescription>
          A request failed while loading your centre data. Retry the route after checking your
          Supabase and Stripe configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error.message}
        </div>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
