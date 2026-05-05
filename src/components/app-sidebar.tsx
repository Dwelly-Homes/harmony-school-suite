import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  ClipboardList, Receipt, Megaphone, School,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const items = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, roles: ["admin","teacher","parent"] },
  { title: "Students", url: "/app/students", icon: Users, roles: ["admin","teacher","parent"] },
  { title: "Teachers", url: "/app/teachers", icon: GraduationCap, roles: ["admin","teacher"] },
  { title: "Classes", url: "/app/classes", icon: BookOpen, roles: ["admin","teacher","parent"] },
  { title: "Attendance", url: "/app/attendance", icon: CalendarCheck, roles: ["admin","teacher","parent"] },
  { title: "Exams", url: "/app/exams", icon: ClipboardList, roles: ["admin","teacher","parent"] },
  { title: "Fees", url: "/app/fees", icon: Receipt, roles: ["admin","parent"] },
  { title: "Announcements", url: "/app/announcements", icon: Megaphone, roles: ["admin","teacher","parent"] },
];

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { role } = useAuth();
  const isActive = (url: string) => url === "/app" ? path === "/app" : path.startsWith(url);

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-200 hidden md:flex flex-col`}>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <School className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <div className="font-semibold truncate">Northwood Academy</div>}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.filter(i => !role || i.roles.includes(role)).map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>
      <button onClick={onToggle} className="p-3 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent border-t border-sidebar-border">
        {collapsed ? "→" : "← Collapse"}
      </button>
    </aside>
  );
}
