
-- 1) Restrict profile visibility: users see own; admins see all
DROP POLICY IF EXISTS "authenticated read all profiles" ON public.profiles;
CREATE POLICY "users read own profile or admins read all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 2) Move has_role out of the API-exposed public schema into a private schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies that referenced public.has_role to use private.has_role
-- profiles (just created above)
DROP POLICY IF EXISTS "users read own profile or admins read all" ON public.profiles;
CREATE POLICY "users read own profile or admins read all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'));

-- complaints
DROP POLICY IF EXISTS "students delete own, admins delete all" ON public.complaints;
CREATE POLICY "students delete own, admins delete all"
ON public.complaints
FOR DELETE
TO authenticated
USING (auth.uid() = student_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "students read own complaints" ON public.complaints;
CREATE POLICY "students read own complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "students update own, admins update all" ON public.complaints;
CREATE POLICY "students update own, admins update all"
ON public.complaints
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = student_id OR private.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

-- Drop the exposed public.has_role now that nothing references it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
