import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSession, signOutDemo, subscribeToAuth, syncFromStorage } from "@/data/mockData";

export type AppRole = "admin" | "teacher" | "parent";
export type DemoUser = { id: string; email: string; role: AppRole; full_name: string };
export type DemoSession = { user: DemoUser } | null;

interface AuthContextValue {
  session: DemoSession;
  user: DemoUser | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncFromStorage();
    setSession(getSession());
    setLoading(false);

    const unsubscribe = subscribeToAuth((nextSession: DemoSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    const onStorage = () => {
      syncFromStorage();
      setSession(getSession());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role: session?.user.role ?? null,
        loading,
        signOut: signOutDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
