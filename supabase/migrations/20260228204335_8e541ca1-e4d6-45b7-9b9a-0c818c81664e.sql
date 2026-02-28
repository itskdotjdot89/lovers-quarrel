
-- Create friend_links table
CREATE TABLE public.friend_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  friend_email text,
  friend_display_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friend_links_has_target CHECK (friend_user_id IS NOT NULL OR friend_email IS NOT NULL)
);

-- Partial unique indexes to prevent duplicates
CREATE UNIQUE INDEX idx_friend_links_owner_friend ON public.friend_links (owner_user_id, friend_user_id) WHERE friend_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_friend_links_owner_email ON public.friend_links (owner_user_id, friend_email) WHERE friend_email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.friend_links ENABLE ROW LEVEL SECURITY;

-- RLS policies: only owner can access their friend links
CREATE POLICY "Owner can view their friends"
  ON public.friend_links FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can insert friends"
  ON public.friend_links FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update their friends"
  ON public.friend_links FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can delete their friends"
  ON public.friend_links FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Reuse updated_at trigger
CREATE TRIGGER update_friend_links_updated_at
  BEFORE UPDATE ON public.friend_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-link function: when a new user signs up, link any pending friend_links by email
CREATE OR REPLACE FUNCTION public.auto_link_friends()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.friend_links
  SET friend_user_id = NEW.id,
      friend_display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      status = 'linked'
  WHERE friend_email = NEW.email
    AND friend_user_id IS NULL
    AND status = 'pending';
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for auto-link (fires after handle_new_user)
CREATE TRIGGER on_auth_user_created_link_friends
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_friends();
