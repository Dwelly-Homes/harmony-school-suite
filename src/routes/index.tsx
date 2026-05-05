import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { School, Users, CalendarCheck, Receipt, Megaphone, ArrowRight, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Northwood Academy</span>
          </div>
          <Link to="/auth"><Button>Sign in</Button></Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live demo with seeded data
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          The modern way to <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>run your school</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Students, teachers, attendance, exams, fees and announcements — all in one elegant, role-based platform.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="gap-2">Try the demo <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "Student & Teacher records", text: "Photo profiles, parents, qualifications, history." },
          { icon: CalendarCheck, title: "Attendance tracking", text: "Daily marking and per-student calendar views." },
          { icon: GraduationCap, title: "Exams & report cards", text: "Auto-graded marks with GPA computation." },
          { icon: Receipt, title: "Fees & payments", text: "Invoices, partial payments, status badges." },
          { icon: Megaphone, title: "Announcements", text: "School-wide or class-specific messages." },
          { icon: School, title: "Role-based access", text: "Admin, Teacher and Parent dashboards." },
        ].map(f => (
          <div key={f.title} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <f.icon className="h-6 w-6 text-primary mb-3" />
            <div className="font-semibold">{f.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{f.text}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
