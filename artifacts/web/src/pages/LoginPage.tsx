import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { Link } from "wouter";
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

const FAKE_EMAIL = "test@gmail.com";
const FAKE_PASSWORD = "123456";
const FAKE_NAME = "Alex Johnson";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [step, setStep] = useState<"form" | "welcome">("form");
  const [userName, setUserName] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setApiError(null);
    setIsPending(true);

    setTimeout(() => {
      setIsPending(false);
      if (data.email === FAKE_EMAIL && data.password === FAKE_PASSWORD) {
        setUserName(FAKE_NAME);
        setStep("welcome");
      } else {
        setApiError("Invalid credentials. Please try again.");
      }
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-[#050510]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-fuchsia-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 w-full max-w-[480px] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
                <p className="text-white/60">Sign in to continue your journey.</p>
              </div>

              {apiError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="login-error">
                  {apiError}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] transition-all h-12 text-lg"
                    disabled={isPending}
                    data-testid="button-login"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    {isPending ? "Signing in..." : "Login"}
                  </Button>

                  <p className="text-center text-white/50 text-sm pt-1">
                    Don't have an account?{" "}
                    <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors underline underline-offset-2">
                      Sign Up
                    </Link>
                  </p>
                </form>
              </Form>
            </motion.div>
          )}

          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full" />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.6)] relative z-10"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative z-10"
              >
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                  Welcome back,
                </h2>
                <p className="text-2xl font-semibold text-purple-300 mb-3" data-testid="text-username">
                  {userName}
                </p>
                <p className="text-white/50 mb-8">
                  Great to see you again. You're all set.
                </p>

                <Link href="/">
                  <Button className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-lg font-semibold">
                    Continue
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
