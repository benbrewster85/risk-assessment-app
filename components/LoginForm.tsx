"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [view, setView] = useState<
    "enter_email" | "sign_in" | "sign_up" | "forgot_password"
  >("enter_email");
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          router.push("/dashboard");
          router.refresh();
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/auth/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      toast.error(result.error || "An unknown error occurred.");
    } else {
      if (result.status === "USER_EXISTS") {
        setView("sign_in");
      } else if (result.status === "INVITE_PENDING") {
        setView("sign_up");
      } else {
        toast.error(
          "No account or invitation found for this email. Please contact your administrator."
        );
      }
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    }
    // The onAuthStateChange effect will handle the redirect on success
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) {
      toast.error(error.message);
    } else if (data.user?.identities?.length === 0) {
      toast.error(
        "This email is already in use. Please sign in or use the password reset function."
      );
    } else {
      toast.success(
        "Success! Please check your email for a confirmation link to complete your sign-up."
      );
      setView("enter_email");
      setEmail("");
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Please check your email.");
      setView("enter_email");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {view === "enter_email" && (
          <form onSubmit={handleContinueWithEmail}>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
              Sign in or create an account
            </h2>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Checking..." : "Continue with Email"}
            </button>
          </form>
        )}

        {view === "sign_in" && (
          <form onSubmit={handleSignIn}>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
              Welcome Back!
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email-signin"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email-signin"
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="password-signin"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password-signin"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="text-sm text-center mt-2">
              <button
                type="button"
                onClick={() => setView("forgot_password")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setView("enter_email");
                setPassword("");
              }}
              className="mt-2 w-full text-sm text-center text-gray-600 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {view === "forgot_password" && (
          <form onSubmit={handlePasswordReset}>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
              Reset Your Password
            </h2>
            <div>
              <label
                htmlFor="email-reset"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email-reset"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </button>
            <button
              type="button"
              onClick={() => setView("enter_email")}
              className="mt-2 w-full text-sm text-center text-gray-600 hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {view === "sign_up" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
              Complete your account
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password">Create Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setView("enter_email")}
              className="mt-2 w-full text-sm text-center text-gray-600 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
