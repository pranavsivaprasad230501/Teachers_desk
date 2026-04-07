import { createCentreAction } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateCentreForm() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create your centre</CardTitle>
        <CardDescription>
          Set up your institute to unlock the dashboard and start your 14-day trial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createCentreAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Centre name</Label>
            <Input id="name" name="name" placeholder="Excel Academy" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="9876543210" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Main Road, Hyderabad" required />
          </div>
          <SubmitButton type="submit" className="w-fit" pendingLabel="Creating...">
            Create Centre
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
