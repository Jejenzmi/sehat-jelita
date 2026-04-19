-- Allow bootstrapping the very first admin user (only when no roles exist yet)
-- This fixes the "no admin exists" deadlock that prevents any role assignment.

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Bootstrap first admin'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Bootstrap first admin"
      ON public.user_roles
      FOR INSERT
      TO authenticated
      WITH CHECK (
        role = 'admin'::public.app_role
        AND user_id = auth.uid()
        AND NOT EXISTS (SELECT 1 FROM public.user_roles)
      );
    $pol$;
  END IF;
END $$;