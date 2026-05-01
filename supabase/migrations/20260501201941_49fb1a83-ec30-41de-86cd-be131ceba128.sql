-- Explicit admin-only write policies on user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage UPDATE policy for card-images, scoped to user's own folder
CREATE POLICY "Users can update their own card images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);