import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createBillingPortalUrl } from "@/lib/billing";
import { getOwnedCentreOrThrow } from "@/lib/data";

export async function POST() {
  try {
    const user = await requireUser();
    const centre = await getOwnedCentreOrThrow(user.id);

    const url = await createBillingPortalUrl({
      centre,
      email: user.email,
    });

    redirect(url);
  } catch {
    redirect("/dashboard/settings?error=portal_failed");
  }
}
