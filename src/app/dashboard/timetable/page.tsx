import { createHolidayAction, createTimetableEntryAction } from "@/app/actions";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getBatchesForContext, getHolidaysForCentre, getTimetableForContext } from "@/lib/data";
import { AccessDenied } from "@/components/dashboard/access-denied";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TimetablePage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });

  if (!appContext.centre) {
    return <CreateCentreForm />;
  }

  const [entries, batches, holidays] = await Promise.all([
    getTimetableForContext(appContext),
    getBatchesForContext(appContext),
    getHolidaysForCentre(appContext.centre.id),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Schedules"
          title="Make weekly planning and holiday management feel more intentional."
          description="The timetable now opens with a visual operations card so schedule review feels structured before you dive into entries and holiday dates."
          imageSrc="/operations-scene.svg"
          imageAlt="Illustration of scheduling, holiday planning, and weekly timetable management"
          tone="amber"
        />

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

        <Card>
          <CardHeader>
            <CardTitle>Holiday calendar</CardTitle>
            <CardDescription>Holiday emails are sent to affected students on the holiday date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {holidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No holidays scheduled yet.</p>
            ) : (
              holidays.map((holiday) => (
                <div key={holiday.id} className="rounded-lg border p-4 text-sm">
                  <p className="font-medium text-slate-900">{holiday.title}</p>
                  <p className="text-muted-foreground">
                    {holiday.holiday_date} · {holiday.branches?.name ?? "All branches"}
                  </p>
                  {holiday.notes ? <p className="text-muted-foreground">{holiday.notes}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {appContext.role === "teacher" ? (
        <AccessDenied title="Read-only timetable" description="Teachers can view the timetable here. Owners and admins add or change entries." />
      ) : (
        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Add holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createHolidayAction} className="grid gap-4">
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
                <Field label="Holiday date" id="holiday_date" type="date" />
                <Field label="Title" id="title" placeholder="Diwali holiday" />
                <Field label="Notes" id="notes" placeholder="Centre will remain closed for all classes." required={false} />
                <SubmitButton type="submit" pendingLabel="Saving...">
                  Add Holiday
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  id: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} type={type} required={required} />
    </div>
  );
}
