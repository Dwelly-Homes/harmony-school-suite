import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { School } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DEMO_ACCOUNTS, signInDemo, signUpDemo } from "@/data/mockData";

export const Route = createFileRoute("/auth")({ component: AuthPage });

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

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      signInDemo(email, password);
      navigate({ to: "/app" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const signUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      signUpDemo({ name, email, password });
      toast.success("Demo account created");
      navigate({ to: "/app" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const seedDemo = (demo: typeof DEMO_ACCOUNTS[number]) => {
    setLoading(true);
    try {
      signInDemo(demo.email, demo.password);
      navigate({ to: "/app" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo sign in failed");
    } finally {
      setLoading(false);
    }
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
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <Button className="w-full" disabled={loading}>{loading ? "..." : "Sign in"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3 mt-4">
                  <div><Label>Full name</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <Button className="w-full" disabled={loading}>{loading ? "..." : "Create account"}</Button>
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
            {DEMO_ACCOUNTS.map((demo) => (
              <Button key={demo.role} variant="outline" disabled={loading} onClick={() => seedDemo(demo)}>{demo.role}</Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
