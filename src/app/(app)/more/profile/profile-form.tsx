"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Store } from "@/components/icons";
import { updateBusinessProfile } from "@/features/settings/actions";
import { businessProfileSchema } from "@/features/settings/schemas";
import type { z } from "zod";

interface ProfileFormProps {
  initialName: string;
  businessType?: string;
}

type FormValues = z.infer<typeof businessProfileSchema>;

export function ProfileForm({ initialName, businessType }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: initialName,
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateBusinessProfile(values);
      if (!result.success) {
        setServerError(result.error ?? "Failed to update profile.");
        return;
      }
      router.back();
    });
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-sm">
      <CardContent className="p-6 sm:p-8">
        
        {/* Profile Header Block */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
            <Store className="size-7" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate tracking-tight">
              {initialName}
            </h2>
            {businessType && (
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="capitalize bg-background/50 backdrop-blur-sm border-border/50 font-medium">
                  {businessType.replaceAll("_", " ")}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">
                    Business Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      placeholder="Enter your business name"
                      className="h-12 rounded-xl bg-background/50 backdrop-blur-sm focus-visible:bg-background transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                    This name is public. It will appear on digital receipts and in the SMS notifications sent to your customers.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10 text-destructive">
                <AlertDescription className="font-medium">{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isPending || !form.formState.isDirty}
                loading={isPending}
                className="w-full shadow-[var(--shadow-hero)] transition-all duration-300 active:scale-[0.98]"
              >
                {!isPending && <Save className="mr-2 size-5" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
