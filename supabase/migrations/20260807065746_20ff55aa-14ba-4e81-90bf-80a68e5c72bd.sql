CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_count integer;
  chosen public.app_role;
BEGIN
  SELECT count(*) INTO existing_count FROM public.user_roles;
  IF existing_count = 0 OR lower(NEW.email) = 'admin@kinozal.uz' THEN
    chosen := 'admin'::public.app_role;
  ELSE
    chosen := 'user'::public.app_role;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;