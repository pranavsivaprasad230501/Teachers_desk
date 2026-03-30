import { createTestAction, saveTestScoresAction } from "@/app/actions";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getBatchesForContext, getStudentsForBatch, getTestScores, getTestsForContext } from "@/lib/data";

type TestsPageProps = {
  searchParams: Promise<{
    batch_id?: string;
    test_id?: string;
  }>;
};

export default async function TestsPage({ searchParams }: TestsPageProps) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    return <CreateCentreForm />;
  }

  const params = await searchParams;
  const [tests, batches] = await Promise.all([
    getTestsForContext(appContext),
    getBatchesForContext(appContext),
  ]);
  const selectedBatchId = params.batch_id ?? batches[0]?.id;
  const selectedTestId = params.test_id ?? tests[0]?.id;
  const [students, scores] = await Promise.all([
    selectedBatchId ? getStudentsForBatch(selectedBatchId) : Promise.resolve([]),
    selectedTestId ? getTestScores(selectedTestId) : Promise.resolve([]),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Assessments"
          title="Give test setup and scoring a more energetic presentation."
          description="The tests area now opens with a visual scene that complements score entry and makes performance tracking feel more polished."
          imageSrc="/students-scene.svg"
          imageAlt="Illustration of academic tests, scoring cards, and student performance records"
          tone="teal"
        />

        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <CardDescription>Create tests and record marks batch-wise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium text-slate-900">{test.title}</p>
                <p className="text-muted-foreground">{test.batches?.name} · {test.test_date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {selectedTestId && selectedBatchId ? (
          <Card>
            <CardHeader>
              <CardTitle>Enter marks</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveTestScoresAction} className="space-y-4">
                <input type="hidden" name="test_id" value={selectedTestId} />
                <input type="hidden" name="batch_id" value={selectedBatchId} />
                {students.map((student) => {
                  const score = scores.find((item) => item.student_id === student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-slate-900">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.roll_number ?? "No roll number"}</p>
                      </div>
                      <Input
                        name={`marks:${student.id}`}
                        type="number"
                        defaultValue={score ? String(score.marks) : ""}
                        className="max-w-32"
                      />
                    </div>
                  );
                })}
                {students.length > 0 ? (
                  <SubmitButton type="submit" pendingLabel="Saving...">
                    Save Scores
                  </SubmitButton>
                ) : null}
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create test</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTestAction} className="grid gap-4">
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
            <Field label="Title" id="title" placeholder="Unit Test 1" />
            <Field label="Max marks" id="max_marks" type="number" />
            <Field label="Test date" id="test_date" type="date" />
            <SubmitButton type="submit" pendingLabel="Creating...">
              Create Test
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
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
