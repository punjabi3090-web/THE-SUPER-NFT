import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, KeyRound, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useForgotPassword, useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const COOLDOWN = 60;

function useCooldown() {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setSeconds(COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { seconds, start, active: seconds > 0 };
}

// ─── Step 1: Email ────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});
type EmailForm = z.infer<typeof emailSchema>;

// ─── Step 3: New Password ─────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmNewPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordInput({ field, placeholder, testId }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value?: string }; placeholder: string; testId: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30 pr-10"
        data-testid={testId}
        {...field}
      />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors" tabIndex={-1}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const cooldown = useCooldown();

  // Step 1 form
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Step 3 form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const onSubmitEmail = (data: EmailForm) => {
    setApiError(null);
    forgotPassword.mutate(
      { data: { email: data.email } },
      {
        onSuccess: () => {
          setEmail(data.email);
          cooldown.start();
          setStep(2);
        },
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Something went wrong. Please try again.");
        },
      }
    );
  };

  const handleResend = () => {
    if (cooldown.active) return;
    setApiError(null);
    forgotPassword.mutate(
      { data: { email } },
      {
        onSuccess: () => cooldown.start(),
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Failed to resend. Please try again.");
        },
      }
    );
  };

  const handleCodeContinue = () => {
    if (code.length !== 6) return;
    setApiError(null);
    setStep(3);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    setApiError(null);
    resetPassword.mutate(
      { data: { email, code, newPassword: data.newPassword, confirmNewPassword: data.confirmNewPassword } },
      {
        onSuccess: () => setStep(4),
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Failed to reset password. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-[#050510]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-fuchsia-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 w-full max-w-[480px] p-6 sm:p-8">
        <AnimatePresence mode="wait">

          {/* Step 1 — Enter Email */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-fuchsia-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Forgot Password?</h1>
                <p className="text-white/60 text-sm">Enter your email and we'll send you a reset code.</p>
              </div>

              {apiError && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{apiError}</div>
              )}

              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5">
                  <FormField control={emailForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30" data-testid="input-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={forgotPassword.isPending}
                    className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-base"
                    data-testid="button-send-code"
                  >
                    {forgotPassword.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Send Reset Code
                  </Button>

                  <p className="text-center text-white/50 text-sm">
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors inline-flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3" /> Back to Login
                    </Link>
                  </p>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Step 2 — Enter Code */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-white/60 text-sm mb-1">We sent a 6-digit reset code to</p>
              <p className="text-white font-medium mb-8">{email}</p>

              {apiError && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">{apiError}</div>
              )}

              <div className="flex justify-center mb-8">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg bg-black/20 border-white/20 text-white rounded-md" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={handleCodeContinue} disabled={code.length !== 6}
                className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-base mb-4"
                data-testid="button-verify-code"
              >
                Continue
              </Button>

              <button onClick={handleResend} disabled={cooldown.active || forgotPassword.isPending}
                className="text-sm transition-colors disabled:cursor-not-allowed"
                style={{ color: cooldown.active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)" }}
              >
                {cooldown.active
                  ? `Resend code in ${cooldown.seconds}s`
                  : forgotPassword.isPending
                  ? "Sending..."
                  : "Didn't receive it? Resend Code"}
              </button>
            </motion.div>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="mb-7 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-fuchsia-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Set New Password</h2>
                <p className="text-white/60 text-sm">Choose a strong password for your account.</p>
              </div>

              {apiError && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{apiError}</div>
              )}

              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">New Password</FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Min 6 characters" testId="input-new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={passwordForm.control} name="confirmNewPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Repeat password" testId="input-confirm-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={resetPassword.isPending}
                    className="w-full mt-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-base"
                    data-testid="button-reset-password"
                  >
                    {resetPassword.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Update Password
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/10 blur-[50px] rounded-full" />

              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.6)] relative z-10"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
                <p className="text-purple-300 font-medium mb-2">Successfully changed</p>
                <p className="text-white/50 text-sm mb-8">Your password has been updated. You can now log in with your new password.</p>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-base font-semibold">
                    Back to Login
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
