"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { OTPInput } from "@/features/auth/components/otp-input";
import { ResendTimer } from "@/features/auth/components/resend-timer";
import {
  otpSchema,
  type OTPSchemaInput,
} from "@/features/auth/schemas/otp-schema";
import { verifyOTP } from "@/features/auth/actions/verify-otp";
import { resendOTP } from "@/features/auth/actions/resend-otp";
import posthog from "posthog-js";

export default function VerifyForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OTPSchemaInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      phone,
      otp: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = (values: OTPSchemaInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await verifyOTP(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      posthog.identify(result.data.user.id, {
        phone: result.data.user.phone,
        role: result.data.user.role,
      });
      posthog.capture("login_completed", {
        role: result.data.user.role,
        has_business: result.data.business !== null,
      });
      router.replace(result.data.redirectTo);
    });
  };

  const handleResend = async () => {
    if (isPending) return;

    setServerError(null);
    startTransition(async () => {
      const result = await resendOTP({ phone });
      if (!result.success) {
        setServerError(result.error);
        return;
      }
    });
  };

  const handleBack = () => {
    router.push(`/login?phone=${encodeURIComponent(phone)}`);
  };

  const isFormDisabled = isPending;

  // Mask phone number for display
  const maskedPhone = phone
    .replace(/(\d{4})$/, " $1")
    .replace(/^(\d{5})/, "$1 ");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] mx-auto">
        {/* Back + Header */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={handleBack}
            disabled={isPending}
            className="flex items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8 cursor-pointer disabled:opacity-50"
            aria-label="Go back to phone number"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>

          <div className="text-center mb-8">
            <h2 className="text-[22px] font-semibold text-foreground">
              Verify your number
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              We sent a code to{" "}
              <span className="font-medium text-foreground">
                +91 {maskedPhone}
              </span>
            </p>
          </div>
        </div>

        {/* OTP Form */}
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-center space-y-2">
                    <FormControl>
                      <OTPInput
                        value={field.value}
                        disabled={isPending}
                        hasError={
                          !!serverError ||
                          (form.formState.isSubmitted &&
                            !!form.formState.errors.otp)
                        }
                        onChange={(value) => {
                          field.onChange(value);
                          if (serverError) setServerError(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="full"
                disabled={isFormDisabled}
                loading={isPending}
                className="shadow-[var(--shadow-hero)]"
              >
                Verify & Continue
              </Button>
            </form>
          </Form>

          {/* Resend Timer */}
          <div className="flex justify-center">
            <ResendTimer
              initialSeconds={30}
              onResend={handleResend}
              isResending={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
