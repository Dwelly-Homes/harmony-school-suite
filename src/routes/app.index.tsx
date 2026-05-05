import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, CalendarCheck, Plus, ClipboardCheck, Receipt } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { getDashboardSnapshot } from "@/data/mockData";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, attendance: 0 });
  const [enrollment, setEnrollment] = useState<{ month: string; count: number }[]>([]);
  const [gender, setGender] = useState<{ name: string; value: number }[]>([]);
  const [activity, setActivity] = useState<{ title: string; date: string }[]>([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    const snapshot = getDashboardSnapshot();
    const students = snapshot.students;
    const announcements = snapshot.announcements.slice(0, 5);

    setStats({
      students: snapshot.students.length,
      teachers: snapshot.teachers.length,
      classes: snapshot.classes.length,
      attendance: snapshot.attendanceRate,
    });

    const buckets: Record<string, number> = {};
    for (let index = 5; index >= 0; index -= 1) {
      const date = startOfMonth(subMonths(new Date(), index));
      buckets[format(date, "MMM")] = 0;
    }
    students.forEach((student) => {
      const key = format(new Date(student.admission_date), "MMM");
      if (key in buckets) buckets[key] += 1;
    });
    setEnrollment(Object.entries(buckets).map(([month, count]) => ({ month, count })));

    const genderMap: Record<string, number> = { male: 0, female: 0, other: 0 };
    students.forEach((student) => {
      if (student.gender) genderMap[student.gender] += 1;
    });
    setGender(Object.entries(genderMap).filter(([, value]) => value > 0).map(([name, value]) => ({ name: name[0].toUpperCase() + name.slice(1), value })));

    setActivity(announcements.map((announcement) => ({ title: announcement.title, date: format(new Date(announcement.created_at), "MMM d, yyyy") })));
  }

  const COLORS = ["oklch(0.45 0.15 250)", "oklch(0.65 0.16 150)", "oklch(0.78 0.16 75)"];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of school operations and performance."
        actions={
          <>
            <Link to="/app/students"><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add student</Button></Link>
            <Link to="/app/attendance"><Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4 mr-1" />Attendance</Button></Link>
            <Link to="/app/fees"><Button size="sm"><Receipt className="h-4 w-4 mr-1" />Invoice</Button></Link>
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
                <Bar dataKey="count" fill="oklch(0.45 0.15 250)" radius={[6, 6, 0, 0]} />
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
                  {gender.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-2">
              {gender.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index] }} />{item.name}: {item.value}
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
            {activity.map((item, index) => (
              <li key={index} className="flex items-center justify-between border-l-2 border-primary pl-3">
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
