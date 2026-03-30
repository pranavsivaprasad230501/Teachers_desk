"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { AppDatabase } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createBrowserClient<AppDatabase>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
