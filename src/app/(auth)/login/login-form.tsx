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
import { Gift } from "@/components/icons";
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
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Brand Icon */}
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-hero)]">
            <Gift className="size-8 text-primary-foreground" strokeWidth={2} />
          </div>

          {/* App Name & Tagline */}
          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
              RewardLoop
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground font-normal">
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

              <Button
                type="submit"
                size="full"
                disabled={isFormDisabled}
                loading={isPending}
                className="shadow-[var(--shadow-hero)]"
              >
                Continue
              </Button>
            </form>
          </Form>

          {/* Terms */}
          <p className="text-[12px] text-muted-foreground text-center leading-relaxed max-w-[280px] mx-auto">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
