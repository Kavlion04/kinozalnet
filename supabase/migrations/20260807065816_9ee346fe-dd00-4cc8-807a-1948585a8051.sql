REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.bump_comment_report_count() FROM authenticated, anon, public;