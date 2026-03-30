import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { AppDatabase } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<AppDatabase>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies. Proxy and route
            // handlers cover the mutation path.
          }
        },
      },
    }
  );
}
