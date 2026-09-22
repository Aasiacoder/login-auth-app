CREATE TABLE public.users_profile (
  id uuid PRIMARY KEY,
  last_login_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.users_profile TO authenticated;
GRANT ALL ON public.users_profile TO service_role;

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.users_profile FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON public.users_profile FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users_profile FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_profile_updated_at
BEFORE UPDATE ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();