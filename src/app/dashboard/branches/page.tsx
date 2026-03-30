import { createBranchAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser } from "@/lib/data";

export default async function BranchesPage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });

  if (!appContext.centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers can view schedules but cannot manage branch settings." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Branch Network"
          title="Show every location as part of one coordinated operation."
          description="The branch area now opens with a visual summary so multi-location management feels more intentional and easier to scan."
          imageSrc="/operations-scene.svg"
          imageAlt="Illustration of branch operations and connected centre locations"
          tone="sky"
        />
        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
            <CardDescription>Manage multiple locations under one centre account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appContext.branches.map((branch) => (
              <div key={branch.id} className="rounded-lg border p-4">
                <p className="font-medium text-slate-900">
                  {branch.name} {branch.is_main ? "· Main" : ""}
                </p>
                <p className="text-sm text-muted-foreground">{branch.phone ?? "No phone set"}</p>
                <p className="text-sm text-muted-foreground">{branch.address ?? "No address set"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add branch</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBranchAction} className="grid gap-4">
            <Field label="Branch name" id="name" placeholder="KPHB Branch" />
            <Field label="Phone" id="phone" placeholder="9876543210" />
            <Field label="Address" id="address" placeholder="Road No. 2, Hyderabad" />
            <SubmitButton type="submit" pendingLabel="Creating...">
              Create Branch
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
