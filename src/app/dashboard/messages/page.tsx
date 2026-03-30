import Link from "next/link";

import { createBroadcastAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Notification outbox</CardTitle>
          <CardDescription>Queued, sent, and failed parent communication records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="rounded-lg border p-4 text-sm">
              <p className="font-medium text-slate-900">{message.category}</p>
              <p className="text-muted-foreground">{message.recipient_phone}</p>
              <p className="mt-1 text-slate-700">{message.message_body}</p>
              <p className="mt-1 text-xs uppercase text-muted-foreground">{message.status}</p>
            </div>
          ))}
          <div className="pt-2">
            <Link href="/api/jobs/notifications?run=1" className="text-sm font-medium text-sky-700 hover:underline">
              Trigger dispatch job
            </Link>
          </div>
        </CardContent>
      </Card>

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

function Field({ label, id, placeholder }: { label: string; id: string; placeholder: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} required />
    </div>
  );
}
