DROP POLICY IF EXISTS "Profiles are viewable" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_comment_report_count() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;