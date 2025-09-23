"use client";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setloading] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      setloading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
        console.log(session?.user);
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error(error);
      } finally {
        setloading(false);
      }
    }
    checkUser();
  }, []);
  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Error signing out:", error);
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
