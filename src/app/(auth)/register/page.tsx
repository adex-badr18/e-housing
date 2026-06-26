"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


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

const registerSchema = z
  .object({
    fullName: z.string().min(2, { message: "Full name is required." }),
    staffId: z.string().min(1, { message: "Staff ID is required." }),
    email: z
      .string()
      .email({ message: "Enter a valid email." })
      .refine((v) => v.endsWith("@oauife.edu.ng"), {
        message: "Must be an OAU email (@oauife.edu.ng).",
      }),
    department: z.string().min(1, { message: "Department is required." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      staffId: "",
      email: "",
      department: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.info(
        "Google OAuth is not yet configured. Please use the manual form or contact the Housing Unit."
      );
    } finally {
      setOauthLoading(false);
    }
  }

  async function onSubmit(_values: RegisterSchema) {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.info(
      "Manual registration is coming soon. Please use OAU Google login for now."
    );
    setFormLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgba(27,34,50,0.03)] p-4 py-12">
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
        style={{ borderTop: "4px solid rgb(27,34,50)" }}
      >
        <CardHeader className="space-y-3 text-center pb-6 border-b">
          {/* OAU logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/oaulogo.png"
              alt="OAU Logo"
              width={180}
              height={30}
              className="h-10 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[rgb(27,34,50)]">
            New Staff Registration
          </CardTitle>
          <CardDescription className="text-sm pb-1">
            Register to access the OAU Staff Housing portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {/* ── Google OAuth (Primary) ── */}
          <div className="space-y-2">
            <Button
              id="google-oauth-btn"
              type="button"
              className="w-full flex items-center gap-2 border-2 font-semibold"
              style={{
                backgroundColor: "rgb(27,34,50)",
                color: "rgba(246,244,238,1)",
                borderColor: "rgb(228,187,103)",
              }}
              disabled={oauthLoading}
              onClick={handleGoogleSignIn}
            >
              <Mail className="size-4" />
              {oauthLoading ? "Redirecting..." : "Continue with OAU Google"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Restricted to{" "}
              <span className="font-medium text-[rgb(27,34,50)]">
                @oauife.edu.ng
              </span>{" "}
              accounts only
            </p>
          </div>

          {/* ── Divider ── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                or register manually
              </span>
            </div>
          </div>

          {/* ── Credential Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-fullName">Full Name</Label>
              <Input
                id="reg-fullName"
                placeholder="e.g. Dr. Adebayo Okafor"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-staffId">Staff ID</Label>
                <Input
                  id="reg-staffId"
                  placeholder="e.g. OAU/STAFF/001"
                  {...register("staffId")}
                />
                {errors.staffId && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {errors.staffId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-department">Department</Label>
                <Input
                  id="reg-department"
                  placeholder="e.g. Physics"
                  {...register("department")}
                />
                {errors.department && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">OAU Email</Label>
              <Input
                id="reg-email"
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
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-confirmPassword">Confirm Password</Label>
              <Input
                id="reg-confirmPassword"
                type="password"
                placeholder="Re-enter password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              id="reg-submit-btn"
              type="submit"
              className="w-full"
              disabled={formLoading}
              style={{
                backgroundColor: "rgb(27,34,50)",
                color: "rgba(246,244,238,1)",
              }}
            >
              {formLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground pt-1">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-[rgb(27,34,50)] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
