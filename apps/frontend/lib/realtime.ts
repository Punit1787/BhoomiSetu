"use client";

import { createClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";

export function subscribeToCaseUpdates(queryClient: QueryClient) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return () => undefined;

  const supabase = createClient(url, key);
  const channel = supabase
    .channel("bhoomsetu-case-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, (payload) => {
      void queryClient.invalidateQueries({ queryKey: ["cases"] });
      const record = (payload.new ?? payload.old) as { id?: string };
      if (record.id) void queryClient.invalidateQueries({ queryKey: ["case", record.id] });
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
