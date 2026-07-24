"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    mode: "onChange",
  });

  const onSubmit = (values: OTPSchemaInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await verifyOTP(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // Navigate to destination (either Dashboard or Onboarding)
      router.push(result.data.redirectTo);
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

  const isFormDisabled = isPending || !form.formState.isValid;

  // Mask phone number for display
  const maskedPhone = phone
    .replace(/(\d{4})$/, " $1")
    .replace(/^(\d{5})/, "$1 ");

  return (
    <Card className="w-full max-w-md shadow-lg border bg-card rounded-xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="pl-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            disabled={isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="text-lg font-bold tracking-tight text-primary">
            RewardLoop
          </div>
        </div>

        <div className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Verify your number
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">
              +91 {maskedPhone}
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center space-y-2">
                  <FormControl>
                    <OTPInput
                      value={field.value}
                      disabled={isPending}
                      hasError={!!serverError || !!form.formState.errors.otp}
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
              className="w-full h-12 text-base font-medium"
              disabled={isFormDisabled}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center pt-2">
        <ResendTimer
          initialSeconds={30}
          onResend={handleResend}
          isResending={isPending}
        />
      </CardFooter>
    </Card>
  );
}
