"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck } from 'lucide-react';

import { checkGoogleOauthConfiguredAction } from '@/app/actions/auth';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: 'password',
    },
  });

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const { isConfigured } = await checkGoogleOauthConfiguredAction();
      if (!isConfigured) {
        toast.warning(
          "Google OAuth is not configured in .env.local with a valid GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET. Please use your @oauife.edu.ng email below or click a quick login option."
        );
        setIsLoading(false);
        return;
      }
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      toast.error("Google authentication failed. Please try again.");
      setIsLoading(false);
    }
  }

  async function onSubmit(values: LoginSchema) {
    const email = values.email.trim().toLowerCase();

    if (!email.endsWith('@oauife.edu.ng')) {
      toast.error("Domain Restricted: Only @oauife.edu.ng emails are allowed.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await signIn('credentials', {
        email: values.email,
        password: values.password || 'password',
        redirect: false,
      });

      if (!response?.error) {
        toast.success("Authenticated with OAU credentials!");
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error("Authentication failed. Only @oauife.edu.ng institutional emails are permitted.");
      }
    } catch (error) {
      toast.error("An error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to trigger instant first-time OAuth simulation
  const simulateFirstTimeLogin = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newEmail = `new.staff${randomNum}@oauife.edu.ng`;
    setValue('email', newEmail, { shouldValidate: true });
    setValue('password', 'password');
    toast.info(`Simulating Google OAuth for first-time user: ${newEmail}`);
  };

  const fillCredentials = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password', { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(27,34,50,0.03)] p-4">
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-[rgb(27,34,50)]/60 hover:text-[rgb(27,34,50)] transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </Link>

      <Card className="w-full max-w-md shadow-xl border-0 bg-white" style={{ borderTop: "4px solid rgb(27,34,50)" }}>
        <CardHeader className="space-y-3 text-center pb-6 border-b">
          {/* OAU mini-logo */}
          <div className="flex justify-center mb-2">
            <Image 
              src="/oaulogo.png" 
              alt="OAU Logo" 
              width={180}
              height={30}
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[rgb(27,34,50)]">OAU Staff Portal</CardTitle>
          <CardDescription className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="size-4 text-emerald-600 inline" />
            Domain Restricted to <strong className="text-slate-800">@oauife.edu.ng</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Primary Google OAuth Trigger */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold shadow-sm flex items-center justify-center gap-3 transition-all"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google (@oauife.edu.ng)
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider absolute">
              Or Institutional Auth
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Institutional Email (@oauife.edu.ng)</Label>
              <Input 
                id="email"
                className="py-4 text-xs font-mono"
                type="email"
                placeholder="name@oauife.edu.ng" 
                {...register("email")} 
              />
              {errors.email && (
                <p className="text-[0.75rem] font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full py-5 bg-[rgb(27,34,50)] hover:bg-[rgb(27,34,50)]/90 text-xs font-semibold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Continue with Email"}
            </Button>
          </form>

          {/* Quick Mock Testers & First-Time Onboarding Trigger */}
          <div className="pt-4 border-t border-dashed space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[rgb(27,34,50)]">Testing Accounts</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={simulateFirstTimeLogin}
                className="text-[11px] h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-medium gap-1"
              >
                <Sparkles className="size-3 text-amber-600" /> First-Time Staff Simulation
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('staff@oauife.edu.ng')} className="h-7 text-[11px]">Existing Staff (u-6)</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('hsec@oauife.edu.ng')} className="h-7 text-[11px]">Housing Sec</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('estate@oauife.edu.ng')} className="h-7 text-[11px]">Estate Officer</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('dvc@oauife.edu.ng')} className="h-7 text-[11px]">DVC Admin</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('super@oauife.edu.ng')} className="h-7 text-[11px]">Super Admin</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('elec@oauife.edu.ng')} className="h-7 text-[11px]">Elect. Officer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
