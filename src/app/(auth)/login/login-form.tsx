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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
      termsAccepted: false,
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

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-[var(--shadow-soft)]">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[13px] font-normal text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="underline hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          className="underline hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </a>
                        .
                      </FormLabel>
                      <FormMessage />
                    </div>
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
        </div>
      </div>
    </div>
  );
}
