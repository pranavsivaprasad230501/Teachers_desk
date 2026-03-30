import { assignTeacherToBatchAction, inviteStaffAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getBatchesForCentre } from "@/lib/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StaffInviteRecord, StaffMembershipRecord } from "@/lib/types";

export default async function StaffPage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });

  if (!appContext.centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers cannot manage staff or invites." />;
  }

  const supabase = await createServerSupabaseClient();
  const [membershipsResponse, invitesResponse, batches] = await Promise.all([
    supabase.from("staff_memberships").select("*").eq("centre_id", appContext.centre.id),
    supabase.from("staff_invites").select("*").eq("centre_id", appContext.centre.id).order("created_at", { ascending: false }),
    getBatchesForCentre(appContext.centre.id),
  ]);

  const memberships = (membershipsResponse.data ?? []) as StaffMembershipRecord[];
  const invites = (invitesResponse.data ?? []) as StaffInviteRecord[];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff members</CardTitle>
            <CardDescription>Owner, admins, and teachers currently attached to the centre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.map((membership) => (
              <div key={membership.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium text-slate-900">{membership.role}</p>
                <p className="text-muted-foreground">User ID: {membership.user_id}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="rounded-lg border p-4 text-sm">
                  <p className="font-medium text-slate-900">{invite.full_name ?? invite.phone}</p>
                  <p className="text-muted-foreground">{invite.role}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite teacher or admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteStaffAction} className="grid gap-4">
              <Field label="Full name" id="full_name" placeholder="Rahul Verma" />
              <Field label="Phone" id="phone" placeholder="9876543210" />
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select id="role" name="role" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch_id">Branch</Label>
                <select id="branch_id" name="branch_id" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="">Any branch</option>
                  {appContext.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton type="submit" pendingLabel="Inviting...">
                Create Invite
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign teacher to batch</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={assignTeacherToBatchAction} className="grid gap-4">
              <Field label="Teacher user ID" id="teacher_user_id" placeholder="Paste claimed teacher user id" />
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
              <SubmitButton type="submit" pendingLabel="Assigning...">
                Assign Batch
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
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
