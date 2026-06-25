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

const signupSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const toast = useToast();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // 🔍 Updated to print exact Zod schema mismatches when submission blocks
  const onError = (formErrors: any) => {
    console.log("❌ Form validation failed fields:", formErrors);
  };

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    console.log("🚀 Submitting registration to Supabase for:", data.email);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    // If your DB trigger fails, it bubbles up into this authError check
    if (authError) {
      console.error("❌ Supabase Auth error:", authError);
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    console.log("✅ User created successfully in auth.users:", authData.user);
    toast.success("Account created! Check your email for a confirmation link.");
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen bg-bg">
        <div className="flex flex-col justify-center items-center w-full px-6">
          <div className="w-full max-w-[380px] bg-surface border border-border rounded-panel p-8 text-center">
            <h2 className="font-mono text-[13px] text-text mb-4">Check your email</h2>
            <p className="font-sans text-[12px] text-text2 mb-6">
              We sent a confirmation link to your email address. Click the link to activate your account, then sign in.
            </p>
            <Link href="/login" className="text-accent font-mono text-[11px] hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-20">
        <h1 className="font-mono text-[48px] text-accent font-medium">
          tg[scan]
        </h1>
        <p className="font-sans text-[14px] text-text2 mt-4 max-w-sm">
          Create an account to start monitoring Telegram channels.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6">
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="w-full max-w-[380px] bg-surface border border-border rounded-panel p-8"
        >
          <h2 className="font-mono text-[13px] text-text mb-6">Create account</h2>

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
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="font-sans text-[12px] text-text3">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}