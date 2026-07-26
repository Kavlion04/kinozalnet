-- 1) Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Moderation state on comments
CREATE TYPE public.comment_status AS ENUM ('visible', 'pending', 'hidden');

ALTER TABLE public.comments
  ADD COLUMN status public.comment_status NOT NULL DEFAULT 'visible',
  ADD COLUMN report_count integer NOT NULL DEFAULT 0,
  ADD COLUMN moderation_note text,
  ADD COLUMN moderated_at timestamptz,
  ADD COLUMN moderated_by uuid;

CREATE INDEX idx_comments_status ON public.comments (status);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;

CREATE POLICY "Anyone can view visible comments"
ON public.comments FOR SELECT TO anon, authenticated
USING (status = 'visible');

CREATE POLICY "Admins can view all comments"
ON public.comments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update comments"
ON public.comments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comments"
ON public.comments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE, DELETE ON public.comments TO authenticated;

-- 3) Reports
CREATE TYPE public.report_status AS ENUM ('open', 'reviewed', 'dismissed');

CREATE TABLE public.comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open',
  reporter_id uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.comment_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.comment_reports TO authenticated;
GRANT ALL ON public.comment_reports TO service_role;

ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can report a comment"
ON public.comment_reports FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(reason)) BETWEEN 1 AND 60
  AND (details IS NULL OR length(details) <= 1000)
  AND status = 'open'
);

CREATE POLICY "Admins can view reports"
ON public.comment_reports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.comment_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
ON public.comment_reports FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_comment_reports_status ON public.comment_reports (status, created_at DESC);

-- 4) Auto-escalate on report
CREATE OR REPLACE FUNCTION public.bump_comment_report_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.comments
     SET report_count = report_count + 1,
         status = CASE WHEN report_count + 1 >= 3 AND status = 'visible' THEN 'pending'::public.comment_status ELSE status END
   WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_comment_report_count
AFTER INSERT ON public.comment_reports
FOR EACH ROW EXECUTE FUNCTION public.bump_comment_report_count();