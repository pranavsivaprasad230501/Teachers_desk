import Link from "next/link";

import { createBroadcastAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { getAppContextForUser, getBatchesForCentre, getNotificationMessagesForCentre } from "@/lib/data";

export default async function MessagesPage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers do not have broadcast or fee reminder access." />;
  }

  const [messages, batches] = await Promise.all([
    getNotificationMessagesForCentre(appContext.centre.id),
    getBatchesForCentre(appContext.centre.id),
  ]);
  const emailConfigured = Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM_ADDRESS);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Parent Communication"
          title="Make the messaging area feel warmer and easier to trust."
          description="Broadcasts, reminders, and outbox status now sit under a friendlier visual header so communication work feels less utilitarian."
          imageSrc="/team-scene.svg"
          imageAlt="Illustration of a communication dashboard for parent notifications and broadcasts"
          tone="sky"
        />
        <Card>
          <CardHeader>
            <CardTitle>Notification outbox</CardTitle>
            <CardDescription>Queued, sent, and failed parent communication records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!emailConfigured ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                Email delivery is not configured. Add `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` to your environment, then rerun the queue and dispatch jobs.
              </div>
            ) : null}
            {messages.map((message) => (
              <div key={message.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium text-slate-900">{message.category}</p>
                <p className="text-muted-foreground">
                  {message.channel === "email" ? message.recipient_email ?? "No email recipient" : message.recipient_phone ?? "No phone recipient"}
                </p>
                <p className="mt-1 text-slate-700">{message.message_body}</p>
                <p className="mt-1 text-xs uppercase text-muted-foreground">
                  {message.channel} · {message.status}
                </p>
                {getPayloadError(message.payload) ? (
                  <p className="mt-1 text-xs text-red-700">{getPayloadError(message.payload)}</p>
                ) : null}
              </div>
            ))}
            <div className="pt-2">
              <Link href="/api/jobs/risk-alerts?run=1" className="mr-4 text-sm font-medium text-sky-700 hover:underline">
                Queue scheduled reminders
              </Link>
              <Link href="/api/jobs/notifications?run=1" className="text-sm font-medium text-sky-700 hover:underline">
                Trigger dispatch job
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast message</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBroadcastAction} className="grid gap-4">
            <Field label="Title" id="title" placeholder="Holiday Notice" />
            <Field label="Message" id="message" placeholder="Classes are off tomorrow for the festival holiday." />
            <div className="grid gap-2">
              <Label htmlFor="branch_id">Branch</Label>
              <select id="branch_id" name="branch_id" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                <option value="">All branches</option>
                {appContext.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="batch_id">Batch</Label>
              <select id="batch_id" name="batch_id" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                <option value="">All batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton type="submit" pendingLabel="Queueing...">
              Queue Broadcast
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getPayloadError(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const error = (payload as Record<string, unknown>).error;
  return typeof error === "string" && error.trim().length > 0 ? error : null;
}

function Field({ label, id, placeholder }: { label: string; id: string; placeholder: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} required />
    </div>
  );
}
