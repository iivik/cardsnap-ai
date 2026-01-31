-- Fix #1: Make card-images bucket private
-- The bucket is currently public=true, making images accessible to anyone with URL
UPDATE storage.buckets 
SET public = false 
WHERE id = 'card-images';

-- Fix #2: Remove the public SELECT policy on promo_codes
-- Currently ANY authenticated user can view ALL active promo codes
DROP POLICY IF EXISTS "Users can view active promo codes" ON public.promo_codes;

-- Create a secure RPC function to validate promo codes instead
-- This allows users to check if a specific code is valid without exposing all codes
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_to_check TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type discount_type,
  discount_value INTEGER,
  free_scans_bonus INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_valid,
    pc.discount_type,
    pc.discount_value,
    pc.free_scans_bonus
  FROM public.promo_codes pc
  WHERE 
    UPPER(pc.code) = UPPER(code_to_check)
    AND pc.is_active = true
    AND (pc.valid_until IS NULL OR pc.valid_until > now())
    AND pc.valid_from <= now()
    AND (pc.max_uses IS NULL OR pc.current_uses < pc.max_uses);
    
  -- Return empty result if no matching code found
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT) TO authenticated;