"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit() {
    try {
      // In production, this would call an API to send a password reset email
      // For now, we simulate the flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
      toast.success("If this email is registered, you'll receive a reset link.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
        {submitted ? (
          /* ── Success state ── */
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl text-text-primary">
              Check your inbox
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              If an account exists for{" "}
              <span className="text-text-primary font-medium">
                {getValues("email")}
              </span>
              , we&apos;ve sent a password reset link. Please check your email
              and spam folder.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-light transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8 text-center">
              <h2 className="font-display text-2xl text-text-primary">
                Forgot password?
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div className="space-y-1.5">
                <div className="group relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                    className="h-11 rounded-xl border-white/[0.08] bg-white/[0.03] pl-10 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-accent/40 focus:ring-1 focus:ring-accent/25"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="pl-1 text-xs text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="relative h-11 w-full rounded-xl bg-gradient-to-r from-accent to-accent-light font-medium text-white shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-text-muted">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-medium text-accent hover:text-accent-light transition-colors"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
