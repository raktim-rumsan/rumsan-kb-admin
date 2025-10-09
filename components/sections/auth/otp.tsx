"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import useLoginMutation, { useVerifyOtpMutation } from "@/queries/loginQuery";
import { UserSchema } from "@/lib/schemas";
import { initializeAuthAfterLogin } from "@/lib/store-hydration";

export default function AuthOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const loginMutation = useLoginMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const supabase = createClient();

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    setSuccessMessage(null);

    startResendTransition(async () => {
      try {
        loginMutation.mutate(email);

        if (error) {
          throw error;
        }
        setSuccessMessage("OTP sent successfully! Check your email.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "An error occurred");
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, ""); // Remove non-digits

    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split("");
      setOtp(newOtp);

      // Focus on the last input field
      const lastInput = document.getElementById(`otp-5`);
      lastInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    startTransition(async () => {
      try {
        // Verify OTP with backend
        const otpResult = await verifyOtpMutation.mutateAsync({ email, otpCode });

        if (otpResult.error) {
          throw new Error(otpResult.error);
        }

        // Get current user session from Supabase to update UserContext
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session after OTP verification:", sessionError);
        } else if (session?.user) {
          // Update UserStore with the authenticated user
          const convertedUser = UserSchema.parse({
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            user_metadata: session.user.user_metadata,
          });

          // Update UserStore with the authenticated user directly
          import("@/stores/userStore").then(({ useUserStore }) => {
            useUserStore.getState().updateUser(convertedUser);
          });
          initializeAuthAfterLogin();
        }

        // Navigate to dashboard
        router.push("/dashboard");
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Invalid OTP code. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Rumsan AI</h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">One Time Password</CardTitle>
            <CardDescription className="text-gray-600">
              Please enter the OTP sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold border-2"
                  />
                ))}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-black hover:bg-gray-800"
                disabled={isPending}
              >
                {isPending ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Didn&apos;t receive the code?
              <Button
                onClick={handleResendOtp}
                variant="link"
                className="font-medium text-black hover:underline"
                disabled={isResendPending}
              >
                {isResendPending ? "Sending..." : "Try again"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="h-8 flex items-center justify-center mt-4">
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md text-center">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
