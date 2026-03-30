import { saveAttendanceAction } from "@/app/actions";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import {
  getAppContextForUser,
  getAttendanceForDate,
  getBatchesForContext,
  hasPaidAccess,
} from "@/lib/data";

type AttendancePageProps = {
  searchParams: Promise<{
    batch_id?: string;
    date?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  const centre = appContext.centre;

  if (!centre) {
    return <CreateCentreForm />;
  }

  const paidAccess = await hasPaidAccess(centre.id);
  if (!paidAccess) {
    return <SubscriptionGate trialEndsAt={appContext.subscription?.trial_ends_at} />;
  }

  const batches = await getBatchesForContext(appContext);
  const params = await searchParams;
  const selectedBatchId = params.batch_id ?? batches[0]?.id;
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);
  const attendanceRows = selectedBatchId ? await getAttendanceForDate(selectedBatchId, selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <p className="mt-1 text-muted-foreground">
          Batch-wise marking for teachers and owners. Absence alerts are queued automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_200px_auto]">
            <select
              name="batch_id"
              defaultValue={selectedBatchId}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
            <Input name="date" type="date" defaultValue={selectedDate} />
            <SubmitButton type="submit" pendingLabel="Loading...">
              Load
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mark attendance</CardTitle>
          <CardDescription>{attendanceRows.length} students in the selected batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveAttendanceAction} className="space-y-4">
            <input type="hidden" name="date" value={selectedDate} />
            <input type="hidden" name="batch_id" value={selectedBatchId} />
            {attendanceRows.map((student) => (
              <div key={student.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Roll: {student.roll_number ?? "Not set"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`status:${student.id}`}
                      value="present"
                      defaultChecked={student.attendance_status === "present"}
                    />
                    Present
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`status:${student.id}`}
                      value="absent"
                      defaultChecked={student.attendance_status === "absent"}
                    />
                    Absent
                  </label>
                </div>
              </div>
            ))}
            {attendanceRows.length > 0 ? (
              <SubmitButton type="submit" pendingLabel="Saving...">
                Save Attendance
              </SubmitButton>
            ) : (
              <p className="text-sm text-muted-foreground">No students found for this batch.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
