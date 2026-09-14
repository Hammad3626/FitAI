import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { workouts } from "@/lib/fitness-data";

export type FitnessContext = {
  displayName?: string;
  goal?: string;
  weeklyTarget?: number;
  workoutsThisWeek?: number;
  waterCups?: number;
  savedWorkouts?: string[];
};

export function useFitnessContext(): FitnessContext | undefined {
  const { user } = useAuth();
  const [ctx, setCtx] = useState<FitnessContext | undefined>(undefined);

  useEffect(() => {
    if (!user) { setCtx(undefined); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_fitness_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const savedIds: string[] = data?.saved_workouts ?? [];
      const savedTitles = workouts
        .filter((w) => savedIds.includes(w.id))
        .map((w) => `${w.title} (${w.category})`);
      setCtx({
        displayName:
          (user.user_metadata?.display_name as string | undefined) ||
          user.email?.split("@")[0],
        goal: data?.goal ?? undefined,
        weeklyTarget: data?.weekly_target ?? undefined,
        workoutsThisWeek: data?.workouts_this_week ?? undefined,
        waterCups: data?.water_cups ?? undefined,
        savedWorkouts: savedTitles,
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  return ctx;
}
