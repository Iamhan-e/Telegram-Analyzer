"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onError = () => {
    // Validation errors are displayed inline via formState.errors
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      // If Supabase returns ok but no session, the email likely isn't confirmed yet
      if (!authData.session) {
        toast.error(
          "Please confirm your email address first. Check your inbox for a confirmation link."
        );
        setLoading(false);
        return;
      }

      // Hard navigation guarantees the new auth cookies are sent to the server.
      // router.push() can race against cookie persistence, causing the middleware
      // to read a stale (unauthenticated) request and redirect back to /login.
      window.location.href = "/dashboard";
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-20">
        <h1 className="font-mono text-[48px] text-accent font-medium">
          tg[scan]
        </h1>
        <p className="font-sans text-[14px] text-text2 mt-4 max-w-sm">
          Monitor, analyze, and export Telegram channel data — with your own API key.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6">
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="w-full max-w-[380px] bg-surface border border-border rounded-panel p-8"
        >
          <h2 className="font-mono text-[13px] text-text mb-6">Sign in</h2>

          <div className="flex flex-col gap-4">
            <Input
              label="email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1">
            <Link
              href="/reset-password"
              className="font-mono text-[11px] text-text3 hover:text-text transition-colors"
            >
              Forgot password?
            </Link>
            <p className="font-sans text-[12px] text-text3">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-accent hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
