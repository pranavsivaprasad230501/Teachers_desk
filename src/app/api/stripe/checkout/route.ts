import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createCheckoutUrl } from "@/lib/billing";
import { getOwnedCentreOrThrow } from "@/lib/data";
import { type PlanKey } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const centre = await getOwnedCentreOrThrow(user.id);
    const formData = await request.formData();
    const planKey = z.enum(["starter_monthly", "starter_yearly"]).parse(
      formData.get("plan_key")
    ) as PlanKey;

    const url = await createCheckoutUrl({
      centre,
      email: user.email,
      planKey,
    });

    redirect(url);
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect("/dashboard/settings?error=invalid_plan");
    }

    redirect("/dashboard/settings?error=checkout_failed");
  }
}
