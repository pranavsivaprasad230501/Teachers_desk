import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/env";
import { dispatchQueuedNotifications } from "@/lib/notifications";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const interactiveRun = url.searchParams.get("run") === "1";

  if (!interactiveRun && serverEnv.CRON_SECRET && secret !== serverEnv.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await dispatchQueuedNotifications();

  if (interactiveRun) {
    redirect("/dashboard/messages");
  }

  return Response.json({ ok: true });
}
