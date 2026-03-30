import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested route or portal link does not exist.
        </p>
        <Link href="/" className="mt-4 inline-flex">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
