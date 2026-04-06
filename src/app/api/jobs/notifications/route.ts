import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/env";
import { dispatchQueuedNotifications } from "@/lib/notifications";

function isAuthorized(request: Request, interactiveRun: boolean): boolean {
  if (interactiveRun) return true;
  if (!serverEnv.CRON_SECRET) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === serverEnv.CRON_SECRET) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${serverEnv.CRON_SECRET}`) return true;
  return false;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const interactiveRun = url.searchParams.get("run") === "1";

  if (!isAuthorized(request, interactiveRun)) {
    return new Response("Unauthorized", { status: 401 });
  }

  await dispatchQueuedNotifications();

  if (interactiveRun) {
    redirect("/dashboard/messages");
  }

  return Response.json({ ok: true });
}
