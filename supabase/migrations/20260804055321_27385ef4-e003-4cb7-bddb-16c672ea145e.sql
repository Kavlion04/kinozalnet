REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.assign_default_role() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.bump_comment_report_count() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;