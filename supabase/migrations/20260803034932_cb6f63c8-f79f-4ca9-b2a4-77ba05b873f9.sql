DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='movies' AND cmd IN ('INSERT','ALL') LOOP
    EXECUTE format('DROP POLICY %I ON public.movies', p.policyname);
  END LOOP;
END $$;

GRANT SELECT ON public.movies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT ALL ON public.movies TO service_role;

CREATE POLICY "Admins can insert movies" ON public.movies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update movies" ON public.movies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete movies" ON public.movies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));