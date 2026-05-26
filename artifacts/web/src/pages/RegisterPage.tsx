import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import {
  useRegisterUser,
  useVerifyCode,
  useResendCode,
} from "@workspace/api-client-react";
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
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
    email: z.string().email("Invalid email address"),
    confirmEmail: z.string().email("Invalid email address"),
    phoneCountryCode: z.string().min(1, "Country code is required"),
    phoneNumber: z.string().min(5, "Valid phone number required"),
    referralCode: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Email addresses do not match",
    path: ["confirmEmail"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordInput({
  field,
  placeholder,
  testId,
}: {
  field: React.InputHTMLAttributes<HTMLInputElement> & { value?: string };
  placeholder: string;
  testId: string;
}) {
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
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [registeredUser, setRegisteredUser] = useState<{ fullName: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const registerUser = useRegisterUser();
  const verifyCode = useVerifyCode();
  const resendCode = useResendCode();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      confirmEmail: "",
      phoneCountryCode: "+1",
      phoneNumber: "",
      referralCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitRegister = (data: RegisterFormValues) => {
    setApiError(null);
    registerUser.mutate(
      { data },
      {
        onSuccess: (response) => {
          setEmail(response.email);
          setStep(2);
        },
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Failed to register. Please try again.");
        },
      }
    );
  };

  const [code, setCode] = useState("");

  const handleVerify = () => {
    if (code.length !== 6) return;
    setApiError(null);
    verifyCode.mutate(
      { data: { email, code } },
      {
        onSuccess: (response) => {
          setRegisteredUser(response.user);
          setStep(3);
        },
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Invalid verification code.");
        },
      }
    );
  };

  const handleResend = () => {
    setApiError(null);
    resendCode.mutate(
      { data: { email } },
      {
        onSuccess: () => {},
        onError: (err: any) => {
          setApiError(err?.response?.data?.error || "Failed to resend code.");
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-[#050510]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-fuchsia-600/20 blur-[100px] mix-blend-screen animate-pulse"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 w-full max-w-[480px] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join the Elite</h1>
                <p className="text-white/60">Create your account to get started.</p>
              </div>

              {apiError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {apiError}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitRegister)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                            data-testid="input-fullname"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="janedoe_99"
                            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                            data-testid="input-username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="jane@example.com"
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
                      name="confirmEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Confirm Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="jane@example.com"
                              className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                              data-testid="input-confirm-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Phone Number</label>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="phoneCountryCode"
                        render={({ field }) => (
                          <FormItem className="flex-shrink-0">
                            <FormControl>
                              <CountryCodeSelect value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="555 123 4567"
                                className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                                data-testid="input-phone"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Create Password</FormLabel>
                          <FormControl>
                            <PasswordInput field={field} placeholder="Min 6 characters" testId="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Confirm Password</FormLabel>
                          <FormControl>
                            <PasswordInput field={field} placeholder="Repeat password" testId="input-confirm-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">
                          Referral Code{" "}
                          <span className="text-white/40 font-normal">(Optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="H78XZ9"
                            className="bg-black/20 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-white/30"
                            data-testid="input-referral"
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
                    disabled={registerUser.isPending}
                    data-testid="button-register"
                  >
                    {registerUser.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : null}
                    Register
                    {!registerUser.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>

                  <p className="text-center text-white/50 text-sm pt-1">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors underline underline-offset-2"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verify Your Email</h2>
              <p className="text-white/60 mb-8">
                We've sent a 6-digit verification code to
                <br />
                <span className="text-white font-medium">{email}</span>
              </p>

              {apiError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
                  {apiError}
                </div>
              )}

              <div className="flex justify-center mb-8">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-12 h-14 text-lg bg-black/20 border-white/20 text-white rounded-md"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerify}
                disabled={code.length !== 6 || verifyCode.isPending}
                className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-lg mb-4"
                data-testid="button-verify"
              >
                {verifyCode.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Verify
              </Button>

              <button
                onClick={handleResend}
                disabled={resendCode.isPending}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                {resendCode.isPending ? "Resending..." : "Didn't receive code? Resend Code"}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/10 blur-[50px] rounded-full" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(147,51,234,0.6)] relative z-10"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold tracking-tight text-white mb-2 relative z-10">
                Congratulations!
              </h2>
              <p className="text-primary font-medium mb-2 relative z-10">Registration Successful</p>
              <p className="text-white/60 mb-8 relative z-10">
                Welcome aboard, {registeredUser?.fullName}.
                <br />
                Your account is now ready.
              </p>

              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/90 hover:to-fuchsia-600/90 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] h-12 text-lg font-semibold relative z-10">
                  Login to Your Account
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
