import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getRiskAlertsForCentre } from "@/lib/data";

export default async function AlertsPage() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers can mark attendance but dropout-risk review is reserved for owners and admins." />;
  }

  const alerts = await getRiskAlertsForCentre(appContext.centre.id);

  return (
    <div className="space-y-6">
      <SectionHero
        eyebrow="Risk Signals"
        title="Make important alerts stand out without making the page feel harsh."
        description="Owners can review consecutive absences and low-attendance patterns in a screen that now carries more visual structure and breathing room."
        imageSrc="/attendance-scene.svg"
        imageAlt="Illustration of attendance-based alerts and warning indicators"
        tone="rose"
      />
      <Card>
        <CardHeader>
          <CardTitle>Dropout risk alerts</CardTitle>
          <CardDescription>Flags for consecutive absence and low monthly attendance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-medium text-red-900">{alert.students?.name}</p>
                <p className="text-sm text-red-700">{alert.alert_type} · {alert.severity}</p>
                <p className="text-sm text-red-700">{alert.students?.parent_phone}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
