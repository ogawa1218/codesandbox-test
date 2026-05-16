-- 0011_announcement_pdf.sql
-- Allow a PDF attachment on bulletin posts. The file lives in the existing
-- private 'manuals' bucket (store-scoped select policy already lets all
-- store members read it via a short-lived signed URL).
-- MCP was unreachable at authoring time; apply via 'supabase db push'.

alter table public.announcements
  add column if not exists pdf_path text;
