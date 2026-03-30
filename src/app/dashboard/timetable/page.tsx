import { createTimetableEntryAction } from "@/app/actions";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getBatchesForContext, getTimetableForContext } from "@/lib/data";
import { AccessDenied } from "@/components/dashboard/access-denied";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TimetablePage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });

  if (!appContext.centre) {
    return <CreateCentreForm />;
  }

  const [entries, batches] = await Promise.all([
    getTimetableForContext(appContext),
    getBatchesForContext(appContext),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Weekly timetable</CardTitle>
          <CardDescription>Teachers see only their assigned batches. Owners see all schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timetable entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium text-slate-900">
                  {entry.batches?.name} · {weekdayLabels[entry.weekday]}
                </p>
                <p className="text-muted-foreground">
                  {entry.start_time} - {entry.end_time}
                </p>
                <p className="text-muted-foreground">{entry.topic ?? "General class"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {appContext.role === "teacher" ? (
        <AccessDenied title="Read-only timetable" description="Teachers can view the timetable here. Owners and admins add or change entries." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add timetable entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTimetableEntryAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batch_id">Batch</Label>
                <select id="batch_id" name="batch_id" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weekday">Weekday</Label>
                <select id="weekday" name="weekday" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  {weekdayLabels.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Start time" id="start_time" type="time" />
              <Field label="End time" id="end_time" type="time" />
              <Field label="Topic" id="topic" placeholder="Algebra revision" />
              <Field label="Room" id="room" placeholder="Hall A" />
              <SubmitButton type="submit" pendingLabel="Saving...">
                Add Entry
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, id, placeholder, type = "text" }: { label: string; id: string; placeholder?: string; type?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} type={type} required />
    </div>
  );
}
