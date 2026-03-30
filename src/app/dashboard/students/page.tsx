import Link from "next/link";

import {
  createEnrollmentFormAction,
  createStudentAction,
  moveStudentBatchAction,
  processEnrollmentSubmissionAction,
  updateStudentContactsAction,
} from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import {
  getAppContextForUser,
  getBatchesForCentre,
  getEnrollmentFormsForCentre,
  getEnrollmentSubmissionsForCentre,
  getStudentsForCentre,
  hasPaidAccess,
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function StudentsPage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  const centre = appContext.centre;

  if (!centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers do not manage enrollment, branch placement, or fee-linked student records." />;
  }

  const paidAccess = await hasPaidAccess(centre.id);
  if (!paidAccess) {
    return <SubscriptionGate trialEndsAt={appContext.subscription?.trial_ends_at} />;
  }

  const [students, batches, forms, submissions] = await Promise.all([
    getStudentsForCentre(centre.id),
    getBatchesForCentre(centre.id),
    getEnrollmentFormsForCentre(centre.id),
    getEnrollmentSubmissionsForCentre(centre.id),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Student Records"
          title="Make student profiles feel clear, complete, and easy to act on."
          description="Surface guardians, branch placement, fee defaults, and enrollment activity in a friendlier visual layout so admins can scan faster."
          imageSrc="/students-scene.svg"
          imageAlt="Illustration of student profiles and enrollment records arranged in a modern dashboard"
          tone="sky"
        />

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Profiles, batch placement, fee defaults, and portal links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.parent_name ?? "Parent"} · {student.parent_phone}
                    </p>
                    {student.parent_email ? (
                      <p className="text-sm text-muted-foreground">{student.parent_email}</p>
                    ) : (
                      <p className="text-sm text-amber-700">Parent email missing. Absence emails will be skipped.</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.branches?.name ?? "No branch"} · {student.batches?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatCurrency(Number(student.fee_amount))}</p>
                    <p className="text-muted-foreground">Joined {formatDate(student.created_at)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <Link
                    className="text-sm font-medium text-sky-700 hover:underline"
                    href={`/portal/${student.portal_token ?? student.id}`}
                  >
                    Open parent portal
                  </Link>
                  <form action={updateStudentContactsAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="student_id" value={student.id} />
                    <Input
                      name="parent_name"
                      defaultValue={student.parent_name ?? ""}
                      placeholder="Parent name"
                      className="h-8 w-40"
                    />
                    <Input
                      name="parent_phone"
                      defaultValue={student.parent_phone}
                      placeholder="Parent phone"
                      className="h-8 w-36"
                      required
                    />
                    <Input
                      name="parent_email"
                      defaultValue={student.parent_email ?? ""}
                      placeholder="parent@example.com"
                      type="email"
                      className="h-8 w-52"
                    />
                    <SubmitButton type="submit" size="sm" pendingLabel="Saving...">
                      Save Contact
                    </SubmitButton>
                  </form>
                  <form action={moveStudentBatchAction} className="flex items-center gap-2">
                    <input type="hidden" name="student_id" value={student.id} />
                    <select
                      name="batch_id"
                      defaultValue={student.batch_id ?? ""}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                    <SubmitButton type="submit" size="sm" pendingLabel="Moving...">
                      Move
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              submissions.map((submission) => (
                <div key={submission.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-slate-900">{submission.student_name}</p>
                  <p className="text-muted-foreground">{submission.parent_phone}</p>
                  <div className="mt-3 flex gap-2">
                    <form action={processEnrollmentSubmissionAction}>
                      <input type="hidden" name="submission_id" value={submission.id} />
                      <input type="hidden" name="decision" value="accept" />
                      <SubmitButton type="submit" size="sm" pendingLabel="Accepting...">
                        Accept
                      </SubmitButton>
                    </form>
                    <form action={processEnrollmentSubmissionAction}>
                      <input type="hidden" name="submission_id" value={submission.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Rejecting...">
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <SectionHero
          eyebrow="Admissions"
          title="Create new student entries with a little more warmth."
          description="The forms stay practical, but the surrounding visuals now make this part of the workflow feel less dry and more inviting."
          imageSrc="/students-scene.svg"
          imageAlt="Illustration of admissions and student onboarding cards"
          tone="amber"
          className="xl:hidden"
        />

        <Card>
          <CardHeader>
            <CardTitle>Add student</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createStudentAction} className="grid gap-4">
              <Field label="Student name" id="name" placeholder="Aarav Patel" />
              <Field label="Parent name" id="parent_name" placeholder="Meera Patel" required={false} />
              <Field label="Parent phone" id="parent_phone" placeholder="9876543210" />
              <Field label="Parent email" id="parent_email" placeholder="meera@example.com" type="email" required={false} />
              <Field label="Monthly fee" id="fee_amount" placeholder="1500" type="number" />
              <Field label="Fee due date" id="fee_due_date" placeholder="5" type="number" />
              <Field label="Roll number" id="roll_number" placeholder="101" required={false} />
              <div className="grid gap-2">
                <Label htmlFor="batch_id">Batch</Label>
                <select id="batch_id" name="batch_id" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="">Unassigned</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton type="submit" pendingLabel="Adding...">
                Add Student
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={createEnrollmentFormAction}>
              <SubmitButton type="submit" pendingLabel="Creating...">
                Create Enrollment Link
              </SubmitButton>
            </form>
            {forms.map((form) => (
              <div key={form.id} className="rounded-lg border p-3 text-sm">
                <Link href={`/enroll/${form.token}`} className="font-medium text-sky-700 hover:underline">
                  /enroll/{form.token}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
  placeholder: string;
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
