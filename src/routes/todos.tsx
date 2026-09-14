import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/todos")({
  head: () => ({
    meta: [{ title: "Todos — FitAI Supabase Integration" }],
  }),
  component: TodosRoute,
});

function TodosRoute() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Supabase Todos Query</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Querying data using the Supabase client from <code className="bg-muted px-1.5 py-0.5 rounded text-xs">utils/supabase.ts</code>:
        </p>
        <App />
      </div>
    </div>
  );
}
