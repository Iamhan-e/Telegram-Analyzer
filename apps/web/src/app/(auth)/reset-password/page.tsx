"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const resetSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      { redirectTo: `${window.location.origin}/reset-password/confirm` }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-20">
        <h1 className="font-mono text-[48px] text-accent font-medium">
          tg[scan]
        </h1>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6">
        <div className="w-full max-w-[380px] bg-surface border border-border rounded-panel p-8">
          {success ? (
            <div className="text-center">
              <h2 className="font-mono text-[13px] text-text mb-4">Reset link sent</h2>
              <p className="font-sans text-[12px] text-text2 mb-6">
                Check your inbox for a password reset link. The link will expire in 1 hour.
              </p>
              <Link href="/login" className="text-accent font-mono text-[11px] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-mono text-[13px] text-text mb-6">Reset password</h2>

              {error && (
                <div className="bg-red-dim border border-red/30 rounded-card px-3 py-2 mb-4 font-mono text-[11px] text-red">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                  <Input
                    label="email address"
                    type="email"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  <Button type="submit" loading={loading} className="w-full mt-2">
                    Send reset link
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-accent font-mono text-[11px] hover:underline">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
