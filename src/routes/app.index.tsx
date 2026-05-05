import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, CalendarCheck, Plus, ClipboardCheck, Receipt } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, attendance: 0 });
  const [enrollment, setEnrollment] = useState<{ month: string; count: number }[]>([]);
  const [gender, setGender] = useState<{ name: string; value: number }[]>([]);
  const [activity, setActivity] = useState<{ title: string; date: string }[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [s, t, c, a, students, ann] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("teachers").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("attendance").select("status"),
      supabase.from("students").select("admission_date,gender"),
      supabase.from("announcements").select("title,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const total = a.data?.length ?? 0;
    const present = a.data?.filter(x => x.status === "present").length ?? 0;
    setStats({
      students: s.count ?? 0, teachers: t.count ?? 0, classes: c.count ?? 0,
      attendance: total ? Math.round((present / total) * 100) : 0,
    });

    // Enrollment last 6 months
    const buckets: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(new Date(), i));
      buckets[format(d, "MMM")] = 0;
    }
    students.data?.forEach(st => {
      const d = new Date(st.admission_date);
      const key = format(d, "MMM");
      if (key in buckets) buckets[key]++;
    });
    setEnrollment(Object.entries(buckets).map(([month, count]) => ({ month, count })));

    const gMap: Record<string, number> = { male: 0, female: 0, other: 0 };
    students.data?.forEach(st => { if (st.gender) gMap[st.gender]++; });
    setGender(Object.entries(gMap).filter(([,v]) => v > 0).map(([name, value]) => ({ name: name[0].toUpperCase()+name.slice(1), value })));

    setActivity((ann.data ?? []).map(a => ({ title: a.title, date: format(new Date(a.created_at), "MMM d, yyyy") })));
  }

  const COLORS = ["oklch(0.45 0.15 250)", "oklch(0.65 0.16 150)", "oklch(0.78 0.16 75)"];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of school operations and performance."
        actions={
          <>
            <Link to="/app/students"><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1"/>Add student</Button></Link>
            <Link to="/app/attendance"><Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4 mr-1"/>Attendance</Button></Link>
            <Link to="/app/fees"><Button size="sm"><Receipt className="h-4 w-4 mr-1"/>Invoice</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Students" value={stats.students} icon={Users} />
        <StatCard label="Teachers" value={stats.teachers} icon={GraduationCap} accent="bg-success/10 text-success" />
        <StatCard label="Classes" value={stats.classes} icon={BookOpen} accent="bg-warning/10 text-warning" />
        <StatCard label="Attendance" value={`${stats.attendance}%`} icon={CalendarCheck} accent="bg-chart-5/10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Monthly Enrollment</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollment}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.45 0.15 250)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={gender} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {gender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-2">
              {gender.map((g, i) => (
                <div key={g.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />{g.name}: {g.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {activity.length === 0 && <div className="text-sm text-muted-foreground">No recent activity.</div>}
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between border-l-2 border-primary pl-3">
                <span className="text-sm">{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
