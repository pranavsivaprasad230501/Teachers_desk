import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupRequired({ message }: { message: string }) {
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Supabase setup required</CardTitle>
        <CardDescription>
          The app connected to your Supabase project, but the database schema has not been applied
          yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {message}
        </div>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Run this from the repo root after linking Supabase:</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-slate-100">
            <code>npm run supabase:db:push</code>
          </pre>
          <p className="mt-3">
            If you have not linked the project yet, run <code>npx supabase login</code> and{" "}
            <code>npx supabase link --project-ref xckokcycnoojudtighan</code> first.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
