-- BhoomiSetu Phase 4: run once in the linked Supabase SQL editor.
-- Enables Postgres change-data-capture consumed by apps/frontend/lib/realtime.ts.
-- Supabase creates the publication; these statements only add our tables.

alter publication supabase_realtime add table public.cases;
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.grievances;
