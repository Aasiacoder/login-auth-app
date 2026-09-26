ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS email text;
DELETE FROM public.users_profile p WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
ALTER TABLE public.users_profile ADD CONSTRAINT users_profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users_profile TO authenticated;
GRANT ALL ON public.users_profile TO service_role;
CREATE POLICY "Users can delete their own profile" ON public.users_profile FOR DELETE TO authenticated USING (auth.uid() = id);