-- Create function to reset system to initial installation mode
CREATE OR REPLACE FUNCTION public.reset_system_to_initial()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF NOT public.has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admin can reset the system';
  END IF;
  
  -- Reset hospital_profile to initial state
  UPDATE public.hospital_profile
  SET 
    setup_completed = false,
    setup_completed_at = NULL,
    setup_completed_by = NULL,
    enabled_modules = NULL,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_system_to_initial() TO authenticated;