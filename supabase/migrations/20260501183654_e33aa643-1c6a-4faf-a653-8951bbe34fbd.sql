-- Fix privilege escalation: restrict profile updates to non-sensitive fields only
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (currency only)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Prevent users from modifying subscription/credit fields directly.
  -- These fields must only change via SECURITY DEFINER RPCs or service-role webhooks.
  AND subscription_tier = (SELECT subscription_tier FROM public.profiles WHERE user_id = auth.uid())
  AND subscription_status = (SELECT subscription_status FROM public.profiles WHERE user_id = auth.uid())
  AND scan_credits = (SELECT scan_credits FROM public.profiles WHERE user_id = auth.uid())
  AND total_scans_used = (SELECT total_scans_used FROM public.profiles WHERE user_id = auth.uid())
  AND trial_started_at IS NOT DISTINCT FROM (SELECT trial_started_at FROM public.profiles WHERE user_id = auth.uid())
  AND trial_ends_at IS NOT DISTINCT FROM (SELECT trial_ends_at FROM public.profiles WHERE user_id = auth.uid())
  AND razorpay_customer_id IS NOT DISTINCT FROM (SELECT razorpay_customer_id FROM public.profiles WHERE user_id = auth.uid())
  AND razorpay_subscription_id IS NOT DISTINCT FROM (SELECT razorpay_subscription_id FROM public.profiles WHERE user_id = auth.uid())
  AND promo_code_used IS NOT DISTINCT FROM (SELECT promo_code_used FROM public.profiles WHERE user_id = auth.uid())
);

-- Secure RPC for decrementing scan credits (called by client when scan happens)
CREATE OR REPLACE FUNCTION public.decrement_scan_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT scan_credits INTO current_credits
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET scan_credits = scan_credits - 1,
      total_scans_used = total_scans_used + 1
  WHERE user_id = auth.uid();

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_scan_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_scan_credit() TO authenticated;