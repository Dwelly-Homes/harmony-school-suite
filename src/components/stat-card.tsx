import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, accent }: { label: string; value: ReactNode; icon: LucideIcon; accent?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-0.5">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
