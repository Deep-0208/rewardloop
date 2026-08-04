"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { PhoneInput } from "@/features/auth/components/phone-input";
import {
  phoneSchema,
  type PhoneSchemaInput,
} from "@/features/auth/schemas/phone-schema";
import { sendOTP } from "@/features/auth/actions/send-otp";
import { RewardLoopIcon } from "@/components/brand";
import posthog from "posthog-js";

export default function LoginForm({
  initialPhone = "",
}: {
  initialPhone?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<PhoneSchemaInput>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: initialPhone,
    },
    mode: "onChange",
  });

  const onSubmit = (values: PhoneSchemaInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await sendOTP(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      posthog.capture("login_otp_requested");
      router.push(`/verify?phone=${encodeURIComponent(values.phone)}`);
    });
  };

  const isFormDisabled = isPending || !form.formState.isValid;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="flex flex-col items-center gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Brand Icon */}
          <RewardLoopIcon
            size={76}
            className="rounded-[22px] hover:scale-105 transition-transform"
          />

          {/* App Name & Tagline */}
          <div className="text-center space-y-1.5">
            <h1 className="text-3xl tracking-tight">
              <span className="text-foreground font-semibold">Reward</span>
              <span className="text-primary font-bold">Loop</span>
            </h1>
            <p className="text-[14px] font-medium text-muted-foreground/90">
              Reward your regulars
            </p>
          </div>
        </div>

        {/* Login Form */}
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PhoneInput
                        disabled={isPending}
                        hasError={
                          !!serverError || !!form.formState.errors.phone
                        }
                        {...field}
                        onChange={(val) => {
                          field.onChange(val);
                          if (serverError) setServerError(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isFormDisabled}
                  loading={isPending}
                  className="w-full h-[52px] rounded-[14px] text-[16px] font-bold shadow-[var(--shadow-hero)] transition-all duration-300 hover:shadow-[var(--shadow-soft)] active:scale-[0.98]"
                >
                  Continue
                </Button>
                <p className="text-center text-[13px] text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <a
                    href="/terms"
                    className="font-medium underline hover:text-foreground"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="font-medium underline hover:text-foreground"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
