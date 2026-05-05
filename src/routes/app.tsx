import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onMenu={() => setCollapsed((current) => !current)} />
        <main className="flex-1 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
