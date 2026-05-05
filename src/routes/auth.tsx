import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { School } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({ component: AuthPage });

const DEMOS = [
  { role: "Admin",   email: "admin@demo.school",   password: "Demo1234!" },
  { role: "Teacher", email: "teacher@demo.school", password: "Demo1234!" },
  { role: "Parent",  email: "parent@demo.school",  password: "Demo1234!" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/app" });
  }, [session, navigate]);

  const ensureRole = async (userId: string, role: "admin"|"teacher"|"parent") => {
    await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/app" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/app", data: { full_name: name } },
    });
    if (data.user) await ensureRole(data.user.id, "parent");
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Signing in…");
    navigate({ to: "/app" });
  };

  const seedDemo = async (d: typeof DEMOS[number]) => {
    setLoading(true);
    let { data, error } = await supabase.auth.signInWithPassword({ email: d.email, password: d.password });
    if (error) {
      const up = await supabase.auth.signUp({
        email: d.email, password: d.password,
        options: { emailRedirectTo: window.location.origin + "/app", data: { full_name: `${d.role} Demo` } },
      });
      if (up.error) { setLoading(false); return toast.error(up.error.message); }
      data = up.data as typeof data;
      // sign in if email confirm is off; otherwise the session was returned already
      if (!data.session) {
        const si = await supabase.auth.signInWithPassword({ email: d.email, password: d.password });
        data = si.data as typeof data;
        if (si.error) { setLoading(false); return toast.error("Confirm signup is enabled. Disable it in Auth settings or check your email."); }
      }
    }
    if (data.user) await ensureRole(data.user.id, d.role.toLowerCase() as "admin"|"teacher"|"parent");
    setLoading(false);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <School className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Northwood Academy</h1>
          <p className="text-sm text-muted-foreground">School Management Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or pick a demo role to explore.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-3 mt-4">
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
                  <Button className="w-full" disabled={loading}>{loading?"…":"Sign in"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3 mt-4">
                  <div><Label>Full name</Label><Input required value={name} onChange={e=>setName(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
                  <Button className="w-full" disabled={loading}>{loading?"…":"Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick demo access</CardTitle>
            <CardDescription>One click sign-in with seeded role accounts.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {DEMOS.map(d => (
              <Button key={d.role} variant="outline" disabled={loading} onClick={() => seedDemo(d)}>{d.role}</Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
