"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Application error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "Something went wrong while rendering the app."}
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
