import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  ClipboardList, Receipt, Megaphone, School,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileOpenChange,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { role } = useAuth();
  const isMobile = useIsMobile();
  const isActive = (url: string) => (url === "/app" ? path === "/app" : path.startsWith(url));
  const handleMobileClose = () => onMobileOpenChange(false);
  const onSidebarToggle = isMobile ? handleMobileClose : onToggle;

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <School className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <div className="font-semibold truncate">Northwood Academy</div>}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.filter((i) => !role || i.roles.includes(role)).map((item) => {
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
      <button
        onClick={onSidebarToggle}
        className="p-3 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent border-t border-sidebar-border"
      >
        {isMobile ? "Close" : collapsed ? "→" : "← Collapse"}
      </button>
    </>
  );

  return (
    <>
      <aside className={`${collapsed ? "w-16" : "w-64"} shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-200 hidden md:flex flex-col`}>
        {sidebarContent}
      </aside>
      {isMobile && mobileOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={handleMobileClose}
            aria-label="Close sidebar"
          />
          <aside className="relative z-10 h-full w-64 bg-sidebar text-sidebar-foreground shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
