-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'business');

-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM ('none', 'trialing', 'active', 'canceled', 'expired');

-- Create discount_type enum for promo codes
CREATE TYPE public.discount_type AS ENUM ('free_month', 'percentage_off', 'free_scans');

-- Create profiles table with subscription fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  subscription_status public.subscription_status NOT NULL DEFAULT 'none',
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  scan_credits INTEGER NOT NULL DEFAULT 3,
  total_scans_used INTEGER NOT NULL DEFAULT 0,
  subscription_currency TEXT NOT NULL DEFAULT 'INR' CHECK (subscription_currency IN ('INR', 'USD')),
  promo_code_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User roles policies - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create user_categories table for custom categories
CREATE TABLE public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, value)
);

-- Enable RLS on user_categories
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- User categories policies
CREATE POLICY "Users can view their own categories"
ON public.user_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON public.user_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.user_categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.user_categories FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for user_categories updated_at
CREATE TRIGGER update_user_categories_updated_at
BEFORE UPDATE ON public.user_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_meeting_contexts table
CREATE TABLE public.user_meeting_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, value)
);

-- Enable RLS on user_meeting_contexts
ALTER TABLE public.user_meeting_contexts ENABLE ROW LEVEL SECURITY;

-- User meeting contexts policies
CREATE POLICY "Users can view their own meeting contexts"
ON public.user_meeting_contexts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meeting contexts"
ON public.user_meeting_contexts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting contexts"
ON public.user_meeting_contexts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting contexts"
ON public.user_meeting_contexts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for user_meeting_contexts updated_at
CREATE TRIGGER update_user_meeting_contexts_updated_at
BEFORE UPDATE ON public.user_meeting_contexts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL,
  discount_value INTEGER NOT NULL DEFAULT 0,
  free_scans_bonus INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Promo codes policies - admins can do everything, users can view active codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Insert initial ProductHunt promo code
INSERT INTO public.promo_codes (code, discount_type, discount_value, free_scans_bonus, valid_until, max_uses)
VALUES ('PRODUCTHUNT', 'free_month', 100, 10, now() + interval '90 days', 200);

-- Function to initialize default categories for a user
CREATE OR REPLACE FUNCTION public.initialize_user_options()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default categories
  INSERT INTO public.user_categories (user_id, value, label, sort_order, is_system) VALUES
    (NEW.id, 'client', 'Client', 1, true),
    (NEW.id, 'prospect_client', 'Prospect - Client', 2, true),
    (NEW.id, 'prospect_partner', 'Prospect - Partner', 3, true),
    (NEW.id, 'partner', 'Partner', 4, true),
    (NEW.id, 'influencer', 'Influencer', 5, true),
    (NEW.id, 'random', 'Random/Other', 6, true);
  
  -- Insert default meeting contexts
  INSERT INTO public.user_meeting_contexts (user_id, value, label, sort_order, is_system) VALUES
    (NEW.id, 'office_my', 'Office Meeting - My Office', 1, true),
    (NEW.id, 'office_client', 'Office Meeting - Client Office', 2, true),
    (NEW.id, 'office_partner', 'Office Meeting - Partner Office', 3, true),
    (NEW.id, 'event', 'Event/Conference', 4, true),
    (NEW.id, 'other', 'Other', 5, true);
  
  -- Create profile for user
  INSERT INTO public.profiles (user_id, email, trial_started_at, trial_ends_at)
  VALUES (NEW.id, NEW.email, now(), now() + interval '7 days');
  
  RETURN NEW;
END;
$$;

-- Trigger to initialize options on user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_options();