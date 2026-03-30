import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessDenied({
  title = "Access restricted",
  description = "Your role does not have permission to view this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
