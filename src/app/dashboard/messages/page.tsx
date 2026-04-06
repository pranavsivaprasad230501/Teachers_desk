import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageSquare, XCircle } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-sky-100 text-sky-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageSquare,
};

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
  const whatsappConfigured = Boolean(serverEnv.WHATSAPP_WEBHOOK_URL && serverEnv.WHATSAPP_WEBHOOK_TOKEN);

  const sentCount = messages.filter((m) => m.status === "sent").length;
  const failedCount = messages.filter((m) => m.status === "failed").length;
  const queuedCount = messages.filter((m) => m.status === "queued").length;

  return (
    <div className="space-y-6">
      <SectionHero
        eyebrow="Parent Communication"
        title="Send broadcasts and track all parent notifications from one place."
        description="Broadcasts, automated fee reminders, test alerts, and class notices all flow through the outbox below. Connect email and WhatsApp to activate delivery."
        imageSrc="/team-scene.svg"
        imageAlt="Illustration of a communication dashboard for parent notifications and broadcasts"
        tone="sky"
      />

      {/* Provider status */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ChannelStatus
          icon={Mail}
          label="Email (Resend)"
          configured={emailConfigured}
          hint='Set RESEND_API_KEY and EMAIL_FROM_ADDRESS in .env.local'
        />
        <ChannelStatus
          icon={MessageSquare}
          label="WhatsApp"
          configured={whatsappConfigured}
          hint='Set WHATSAPP_WEBHOOK_URL and WHATSAPP_WEBHOOK_TOKEN in .env.local'
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        {/* Outbox */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Outbox</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {sentCount} sent · {queuedCount} queued · {failedCount} failed
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/api/jobs/risk-alerts?run=1"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                Queue reminders <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/api/jobs/notifications?run=1"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Dispatch now <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="divide-y p-0">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet. Queue reminders or send a broadcast to get started.
                </p>
              ) : (
                messages.map((message) => {
                  const ChannelIcon = CHANNEL_ICONS[message.channel ?? "whatsapp"] ?? MessageSquare;
                  const statusStyle = STATUS_STYLES[message.status ?? "queued"] ?? "bg-slate-100 text-slate-600";
                  return (
                    <div key={message.id} className="flex items-start gap-3 px-4 py-3.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <ChannelIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {message.category?.replace(/_/g, " ")}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle}`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {message.channel === "email"
                            ? message.recipient_email ?? "No email"
                            : message.recipient_phone ?? "No phone"}
                          {message.students?.name ? ` · ${message.students.name}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{message.message_body}</p>
                        {getPayloadError(message.payload) ? (
                          <p className="mt-1 text-xs text-rose-600">{getPayloadError(message.payload)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Broadcast form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Broadcast</CardTitle>
            <CardDescription>Sends to all active students matching the filters below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBroadcastAction} className="grid gap-4">
              <Field label="Title" id="title" placeholder="Holiday Notice" />
              <Field label="Message" id="message" placeholder="Classes are off tomorrow for the festival holiday." />

              <div className="grid gap-2">
                <Label htmlFor="channel">Send via</Label>
                <select
                  id="channel"
                  name="channel"
                  className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm"
                  defaultValue="both"
                >
                  <option value="both">Email + WhatsApp</option>
                  <option value="email">Email only</option>
                  <option value="whatsapp">WhatsApp only</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="branch_id">Branch</Label>
                <select id="branch_id" name="branch_id" className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm">
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
                <select id="batch_id" name="batch_id" className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm">
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
              <p className="text-xs text-muted-foreground">
                Messages are queued here, then dispatched on the next notification job run (every 15 minutes on Vercel, or click &ldquo;Dispatch now&rdquo; above).
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChannelStatus({
  icon: Icon,
  label,
  configured,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  configured: boolean;
  hint: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${configured ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${configured ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {configured ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-slate-300" />
          )}
        </div>
        {!configured && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
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


