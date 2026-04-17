"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
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
      password: '',
    },
  });

  async function onSubmit(values: LoginSchema) {
    setIsLoading(true);

    try {
      const response = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!response?.error) {
        toast.success("Logged in successfully!");
        router.push('/dashboard');
        router.refresh(); // Ensure layout correctly receives new session
      } else {
        toast.error("Invalid credentials.");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  // Pre-fill helpers for the mock DB
  const fillCredentials = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password', { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2 text-center pb-8 border-b">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-sm pb-2">
            Sign in to your Staff Quarters account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="name@oauife.edu.ng" 
                {...register("email")} 
              />
              {errors.email && (
                <p className="text-[0.8rem] font-medium text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                {...register("password")} 
              />
              {errors.password && (
                <p className="text-[0.8rem] font-medium text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-dashed">
            <p className="text-sm font-medium text-muted-foreground mb-4 text-center">Mock Testing Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('super@oauife.edu.ng')} className="h-8">Super Admin</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('hsec@oauife.edu.ng')} className="h-8">Housing Sec</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('estate@oauife.edu.ng')} className="h-8">Estate Officer</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('dvc@oauife.edu.ng')} className="h-8">DVC Admin</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('elec@oauife.edu.ng')} className="h-8">Elect. Officer</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fillCredentials('staff@oauife.edu.ng')} className="h-8">Staff User</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
