
-- Fix migrate_hospital_type function - add WHERE clause to UPDATE statement
CREATE OR REPLACE FUNCTION public.migrate_hospital_type(p_new_type TEXT, p_notes TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_old_type TEXT;
  v_profile_id UUID;
  v_old_modules TEXT[];
  v_new_modules TEXT[];
  v_modules_added TEXT[];
  v_modules_removed TEXT[];
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF NOT public.has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admin can migrate hospital type';
  END IF;
  
  -- Validate new type
  IF p_new_type NOT IN ('A', 'B', 'C', 'D', 'FKTP') THEN
    RAISE EXCEPTION 'Invalid hospital type: %', p_new_type;
  END IF;
  
  -- Get current hospital type and profile id
  SELECT id, facility_level::TEXT INTO v_profile_id, v_old_type
  FROM hospital_profile
  LIMIT 1;
  
  IF v_old_type IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Hospital profile not found';
  END IF;
  
  -- Get old available modules
  SELECT ARRAY_AGG(module_code) INTO v_old_modules
  FROM module_configurations
  WHERE is_active = true AND (
    is_core_module = true OR
    CASE v_old_type
      WHEN 'A' THEN available_for_type_a
      WHEN 'B' THEN available_for_type_b
      WHEN 'C' THEN available_for_type_c
      WHEN 'D' THEN available_for_type_d
      WHEN 'FKTP' THEN available_for_fktp
      ELSE false
    END = true
  );
  
  -- Get new available modules
  SELECT ARRAY_AGG(module_code) INTO v_new_modules
  FROM module_configurations
  WHERE is_active = true AND (
    is_core_module = true OR
    CASE p_new_type
      WHEN 'A' THEN available_for_type_a
      WHEN 'B' THEN available_for_type_b
      WHEN 'C' THEN available_for_type_c
      WHEN 'D' THEN available_for_type_d
      WHEN 'FKTP' THEN available_for_fktp
      ELSE false
    END = true
  );
  
  -- Calculate added/removed modules
  v_modules_added := ARRAY(
    SELECT unnest(v_new_modules)
    EXCEPT
    SELECT unnest(v_old_modules)
  );
  
  v_modules_removed := ARRAY(
    SELECT unnest(v_old_modules)
    EXCEPT
    SELECT unnest(v_new_modules)
  );
  
  -- Update hospital profile with WHERE clause
  UPDATE hospital_profile
  SET 
    facility_level = p_new_type::hospital_type_enum,
    enabled_modules = NULL,
    updated_at = now()
  WHERE id = v_profile_id;
  
  -- Log migration
  INSERT INTO hospital_type_migrations (
    from_type, to_type, modules_added, modules_removed, migrated_by, migration_notes
  ) VALUES (
    v_old_type, p_new_type, v_modules_added, v_modules_removed, v_user_id, p_notes
  );
  
  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'from_type', v_old_type,
    'to_type', p_new_type,
    'modules_added', v_modules_added,
    'modules_removed', v_modules_removed
  );
  
  RETURN v_result;
END;
$$;
