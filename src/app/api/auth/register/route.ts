import { NextResponse } from "next/server";
import { z } from "zod";

import { getUsernameValidationMessage, normalizeUsername, usernameToInternalEmail } from "@/lib/auth-credentials";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  password: z.string().min(8),
  username: z.string().min(3).max(30),
});

export async function POST(request: Request) {
  const parsedPayload = requestSchema.safeParse(await request.json());

  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Please enter a valid username and password." }, { status: 400 });
  }

  const username = normalizeUsername(parsedPayload.data.username);
  const usernameError = getUsernameValidationMessage(username);

  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: existingUser } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const { error } = await supabase.auth.admin.createUser({
    email: usernameToInternalEmail(username),
    email_confirm: true,
    password: parsedPayload.data.password,
    user_metadata: {
      username,
    },
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    const message =
      normalizedMessage.includes("already") || normalizedMessage.includes("duplicate")
        ? "That username is already taken."
        : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
