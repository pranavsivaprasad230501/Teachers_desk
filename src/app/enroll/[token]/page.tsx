import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { EnrollmentFormWithBranch } from "@/lib/types";

export default async function EnrollmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: form } = await supabase
    .from("enrollment_forms")
    .select("*, centres(name), branches(name)")
    .eq("token", token)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const typedForm = form as EnrollmentFormWithBranch | null;

  if (!typedForm) {
    notFound();
  }
  const formRecord = typedForm;

  async function submitEnrollment(formData: FormData) {
    "use server";

    const admin = createAdminSupabaseClient();
    const parentEmailValue = formData.get("parent_email");
    const { error } = await admin.from("enrollment_submissions").insert({
      centre_id: formRecord.centre_id,
      branch_id: formRecord.branch_id,
      student_name: String(formData.get("student_name")),
      parent_name: String(formData.get("parent_name")),
      parent_email: typeof parentEmailValue === "string" && parentEmailValue.trim().length > 0 ? parentEmailValue : null,
      parent_phone: String(formData.get("parent_phone")),
      grade: String(formData.get("grade")),
      preferred_batch: String(formData.get("preferred_batch")),
      notes: String(formData.get("notes")),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{formRecord.centres?.name} Enrollment</CardTitle>
          <CardDescription>{formRecord.branches?.name ?? "General admission form"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitEnrollment} className="grid gap-4">
            <Field label="Student name" id="student_name" />
            <Field label="Parent name" id="parent_name" />
            <Field label="Parent phone" id="parent_phone" />
            <Field label="Parent email" id="parent_email" type="email" required={false} />
            <Field label="Grade" id="grade" />
            <Field label="Preferred batch" id="preferred_batch" />
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              />
            </div>
            <Button type="submit">Submit Enrollment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  required = true,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} />
    </div>
  );
}
