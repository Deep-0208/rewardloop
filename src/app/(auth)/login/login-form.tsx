"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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

import { PhoneInput } from "@/features/auth/components/phone-input";
import {
  phoneSchema,
  type PhoneSchemaInput,
} from "@/features/auth/schemas/phone-schema";
import { sendOTP } from "@/features/auth/actions/send-otp";

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
      router.push(`/verify?phone=${encodeURIComponent(values.phone)}`);
    });
  };

  const isFormDisabled = isPending || !form.formState.isValid;

  return (
    <Card className="w-full max-w-md shadow-lg border bg-card rounded-xl">
      <CardHeader className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-primary mb-2">
          RewardLoop
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Enter your mobile number to securely log in or create an account.
        </CardDescription>
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      disabled={isPending}
                      hasError={!!serverError || !!form.formState.errors.phone}
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
              className="w-full h-12 text-base font-medium"
              disabled={isFormDisabled}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
}
