import { createClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/lib/database.types";
import { publicEnv, requireServerEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  return createClient<AppDatabase>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
