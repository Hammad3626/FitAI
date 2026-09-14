CREATE TABLE public.custom_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  goal TEXT,
  level TEXT,
  equipment TEXT,
  days_per_week INTEGER,
  time_min INTEGER,
  focus TEXT,
  injuries TEXT,
  intensity TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own custom routines"
  ON public.custom_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own custom routines"
  ON public.custom_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own custom routines"
  ON public.custom_routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own custom routines"
  ON public.custom_routines FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_routines_updated_at
  BEFORE UPDATE ON public.custom_routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_custom_routines_user_created ON public.custom_routines(user_id, created_at DESC);