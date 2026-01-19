-- Create enum types for meeting context and category
CREATE TYPE meeting_context_type AS ENUM ('office_my', 'office_client', 'office_partner', 'event', 'other');
CREATE TYPE contact_category_type AS ENUM ('client', 'prospect_client', 'prospect_partner', 'partner', 'influencer', 'random');

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  address TEXT,
  handwritten_notes TEXT,
  gps_latitude DECIMAL,
  gps_longitude DECIMAL,
  location_city TEXT,
  location_country TEXT,
  meeting_context meeting_context_type,
  meeting_context_other TEXT,
  category contact_category_type DEFAULT 'random',
  card_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_to_google BOOLEAN DEFAULT false,
  synced_to_hubspot BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own contacts
CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);