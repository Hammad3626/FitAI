ALTER TABLE public.custom_routines
  ADD COLUMN IF NOT EXISTS day_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cycle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_exercises text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS custom_routines_cycle_idx ON public.custom_routines(user_id, cycle_id, day_number);