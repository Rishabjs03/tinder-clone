"use client";

import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AuthPage() {
  const [isSignup, setisSignup] = useState<boolean>(false);
  const [Email, setEmail] = useState<string>("");
  const [Password, setPassword] = useState<string>("");
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [error, seterror] = useState<string>("");
  const supabase = createClient();
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setisLoading(true);
    seterror("");
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: Email,
          password: Password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          seterror("Please check your email for confirmation link!");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: Email,
          password: Password,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setisLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-red-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            StreamMatch
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSignup ? "Create your account" : "Sign In to your account"}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={Email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={Password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : isSignup ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={() => setisSignup(!isSignup)}
            className="text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 text-sm"
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
