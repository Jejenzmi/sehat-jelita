-- Fix migrate_hospital_type function to properly cast text to enum
CREATE OR REPLACE FUNCTION public.migrate_hospital_type(p_new_type TEXT, p_notes TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_old_type TEXT;
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
  
  -- Get current hospital type
  SELECT facility_level::TEXT INTO v_old_type
  FROM hospital_profile
  LIMIT 1;
  
  IF v_old_type IS NULL THEN
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
  
  -- Update hospital profile with proper enum cast
  UPDATE hospital_profile
  SET 
    facility_level = p_new_type::hospital_type_enum,
    enabled_modules = NULL,
    updated_at = now();
  
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

-- Also fix preview_hospital_type_migration function
CREATE OR REPLACE FUNCTION public.preview_hospital_type_migration(p_new_type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_type TEXT;
  v_current_modules jsonb;
  v_new_modules jsonb;
  v_modules_added jsonb;
  v_modules_removed jsonb;
BEGIN
  -- Validate new type
  IF p_new_type NOT IN ('A', 'B', 'C', 'D', 'FKTP') THEN
    RETURN jsonb_build_object('error', 'Invalid hospital type');
  END IF;
  
  -- Get current hospital type
  SELECT facility_level::TEXT INTO v_current_type
  FROM hospital_profile
  LIMIT 1;
  
  IF v_current_type IS NULL THEN
    RETURN jsonb_build_object('error', 'Hospital profile not found');
  END IF;
  
  -- Get current available modules
  SELECT jsonb_agg(jsonb_build_object(
    'code', module_code,
    'name', module_name,
    'category', module_category
  )) INTO v_current_modules
  FROM module_configurations
  WHERE is_active = true AND (
    is_core_module = true OR
    CASE v_current_type
      WHEN 'A' THEN available_for_type_a
      WHEN 'B' THEN available_for_type_b
      WHEN 'C' THEN available_for_type_c
      WHEN 'D' THEN available_for_type_d
      WHEN 'FKTP' THEN available_for_fktp
      ELSE false
    END = true
  );
  
  -- Get new available modules
  SELECT jsonb_agg(jsonb_build_object(
    'code', module_code,
    'name', module_name,
    'category', module_category
  )) INTO v_new_modules
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
  
  -- Calculate added modules (in new but not in current)
  SELECT jsonb_agg(m) INTO v_modules_added
  FROM jsonb_array_elements(COALESCE(v_new_modules, '[]'::jsonb)) m
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(v_current_modules, '[]'::jsonb)) c
    WHERE c->>'code' = m->>'code'
  );
  
  -- Calculate removed modules (in current but not in new)
  SELECT jsonb_agg(m) INTO v_modules_removed
  FROM jsonb_array_elements(COALESCE(v_current_modules, '[]'::jsonb)) m
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(v_new_modules, '[]'::jsonb)) n
    WHERE n->>'code' = m->>'code'
  );
  
  RETURN jsonb_build_object(
    'current_type', v_current_type,
    'new_type', p_new_type,
    'current_modules', COALESCE(v_current_modules, '[]'::jsonb),
    'new_modules', COALESCE(v_new_modules, '[]'::jsonb),
    'modules_added', COALESCE(v_modules_added, '[]'::jsonb),
    'modules_removed', COALESCE(v_modules_removed, '[]'::jsonb)
  );
END;
$$;