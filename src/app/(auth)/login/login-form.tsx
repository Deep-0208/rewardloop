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
        <div className="flex flex-col items-center gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Brand Icon */}
          <div className="flex size-[72px] items-center justify-center rounded-[20px] bg-gradient-to-br from-primary to-primary/80 shadow-[0_8px_32px_rgba(79,70,229,0.3)] ring-1 ring-primary/20 hover:scale-105 transition-transform">
            <Gift className="size-8 text-primary-foreground drop-shadow-sm" strokeWidth={2.5} />
          </div>

          {/* App Name & Tagline */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              RewardLoop
            </h1>
            <p className="text-[15px] font-medium text-muted-foreground/80">
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 px-2 py-3 min-h-[48px]">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-[3px] rounded-[4px] data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-colors"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[13px] font-medium text-muted-foreground leading-7 cursor-pointer select-none flex-1">
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="font-semibold text-foreground underline decoration-border hover:decoration-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          className="font-semibold text-foreground underline decoration-border hover:decoration-primary transition-colors"
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
                className="h-[52px] rounded-[14px] text-[16px] font-bold shadow-[0_8px_20px_rgba(79,70,229,0.2)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(79,70,229,0.3)] active:scale-[0.98]"
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
