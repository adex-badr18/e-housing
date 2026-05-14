"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginSchema) {
    setIsLoading(true);
    try {
      const response = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!response?.error) {
        toast.success("Logged in successfully!");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Invalid credentials.");
      }
    } catch {
      toast.error("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  const fill = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password", { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(228,187,103,0.05)] p-4">
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-[rgb(27,34,50)]/60 hover:text-[rgb(27,34,50)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Home
      </Link>

      <Card
        className="w-full max-w-md shadow-lg border-0"
        style={{ borderTop: "4px solid rgb(228,187,103)" }}
      >
        <CardHeader className="space-y-3 text-center pb-6 border-b">
          {/* OAU logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/oaulogo.png"
              alt="OAU Logo"
              width={180}
              height={30}
              className="object-contain h-10 w-auto rounded-sm"
              loading="eager"
            />
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-[rgb(27,34,50)]">
            Administration Portal
          </CardTitle>

          {/* Restricted Access badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[rgb(228,187,103)] bg-[rgb(228,187,103)]/10 border border-[rgb(228,187,103)]/30 rounded-full px-3 py-1">
              <ShieldCheck className="size-3" />
              Restricted Access
            </span>
          </div>

          <CardDescription className="text-sm pb-1 text-[rgb(27,34,50)]/60">
            This portal is for authorized administrative personnel only.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="name@oauife.edu.ng"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{
                backgroundColor: "rgb(27,34,50)",
                color: "rgba(246,244,238,1)",
              }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Dev mock accounts */}
          <div className="mt-8 pt-6 border-t border-dashed">
            <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
              Mock Testing — Admin Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fill("super@oauife.edu.ng")}
                className="h-8"
              >
                Super Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fill("hsec@oauife.edu.ng")}
                className="h-8"
              >
                Housing Sec
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fill("estate@oauife.edu.ng")}
                className="h-8"
              >
                Estate Officer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fill("dvc@oauife.edu.ng")}
                className="h-8"
              >
                DVC Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fill("elec@oauife.edu.ng")}
                className="h-8 col-span-2"
              >
                Electrical Officer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
