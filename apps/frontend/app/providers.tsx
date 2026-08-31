"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { subscribeToCaseUpdates } from "@/lib/realtime";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true } },
  }));
  useEffect(() => subscribeToCaseUpdates(client), [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
