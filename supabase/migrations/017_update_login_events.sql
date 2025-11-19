-- Update login_events table to include email and event_type fields
ALTER TABLE public.login_events 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'login' CHECK (event_type IN ('login', 'logout', 'failed_login'));

-- Update existing records to have email from profiles table
UPDATE public.login_events 
SET email = p.email 
FROM public.profiles p 
WHERE public.login_events.user_id = p.id 
AND public.login_events.email IS NULL;

-- Make email NOT NULL after updating existing records
ALTER TABLE public.login_events ALTER COLUMN email SET NOT NULL;

-- Create index for email field
CREATE INDEX IF NOT EXISTS idx_login_events_email ON public.login_events(email);



