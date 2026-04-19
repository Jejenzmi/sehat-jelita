-- Add is_enabled column to hospital_enabled_modules for toggle functionality
-- First, ensure the table has proper structure for module toggling

-- Create a simpler approach: Add enabled_modules JSONB to hospital_profile
ALTER TABLE public.hospital_profile 
ADD COLUMN IF NOT EXISTS enabled_modules jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.hospital_profile.enabled_modules IS 'Array of module_codes that are manually enabled/disabled by admin';

-- Create function to check if a module is enabled for the hospital
CREATE OR REPLACE FUNCTION public.is_module_enabled(p_module_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled_modules jsonb;
  v_hospital_type text;
  v_is_available boolean;
BEGIN
  -- Get hospital profile
  SELECT enabled_modules, facility_level INTO v_enabled_modules, v_hospital_type
  FROM hospital_profile
  LIMIT 1;
  
  -- If no hospital profile, return true (setup not done)
  IF v_hospital_type IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if module is in the enabled_modules list (explicit override)
  IF v_enabled_modules IS NOT NULL AND v_enabled_modules != '[]'::jsonb THEN
    RETURN v_enabled_modules ? p_module_code;
  END IF;
  
  -- Fall back to type-based availability
  SELECT 
    CASE v_hospital_type
      WHEN 'A' THEN available_for_type_a
      WHEN 'B' THEN available_for_type_b
      WHEN 'C' THEN available_for_type_c
      WHEN 'D' THEN available_for_type_d
      WHEN 'FKTP' THEN available_for_fktp
      ELSE true
    END INTO v_is_available
  FROM module_configurations
  WHERE module_code = p_module_code;
  
  RETURN COALESCE(v_is_available, false);
END;
$$;

-- Create function to update enabled modules
CREATE OR REPLACE FUNCTION public.update_enabled_modules(p_module_codes text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hospital_profile
  SET enabled_modules = to_jsonb(p_module_codes),
      updated_at = now();
  
  RETURN true;
END;
$$;

-- Create function to toggle a single module
CREATE OR REPLACE FUNCTION public.toggle_module(p_module_code text, p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled_modules text[];
BEGIN
  -- Get current enabled modules as array
  SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(enabled_modules, '[]'::jsonb)))
  INTO v_enabled_modules
  FROM hospital_profile
  LIMIT 1;
  
  IF p_enabled THEN
    -- Add module if not exists
    IF NOT (p_module_code = ANY(v_enabled_modules)) THEN
      v_enabled_modules := array_append(v_enabled_modules, p_module_code);
    END IF;
  ELSE
    -- Remove module
    v_enabled_modules := array_remove(v_enabled_modules, p_module_code);
  END IF;
  
  -- Update hospital profile
  UPDATE hospital_profile
  SET enabled_modules = to_jsonb(v_enabled_modules),
      updated_at = now();
  
  RETURN true;
END;
$$;