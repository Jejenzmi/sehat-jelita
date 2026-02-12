
-- Create storage bucket for smart display media
INSERT INTO storage.buckets (id, name, public) VALUES ('smart-display-media', 'smart-display-media', false);

-- Create table for smart display media
CREATE TABLE IF NOT EXISTS public.smart_display_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.smart_display_media ENABLE ROW LEVEL SECURITY;

-- Create policies for media management
CREATE POLICY "Admins and manajemen can view all smart display media"
ON public.smart_display_media
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

CREATE POLICY "Admins and manajemen can insert smart display media"
ON public.smart_display_media
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

CREATE POLICY "Admins and manajemen can update smart display media"
ON public.smart_display_media
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

CREATE POLICY "Admins and manajemen can delete smart display media"
ON public.smart_display_media
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

-- Create storage policies
CREATE POLICY "Admins and manajemen can upload smart display media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'smart-display-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'))
);

CREATE POLICY "Admins and manajemen can view smart display media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'smart-display-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen')));

CREATE POLICY "Admins and manajemen can delete smart display media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'smart-display-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'))
);
