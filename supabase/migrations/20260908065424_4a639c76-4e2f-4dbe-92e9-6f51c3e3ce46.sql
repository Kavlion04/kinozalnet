CREATE TABLE public.telegram_subscribers (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null unique,
  first_name text,
  username text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.telegram_subscribers TO authenticated;
GRANT ALL ON public.telegram_subscribers TO service_role;
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscribers" ON public.telegram_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));