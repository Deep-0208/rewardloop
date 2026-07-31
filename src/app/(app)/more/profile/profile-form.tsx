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
import { Save } from "lucide-react";
import { updateBusinessProfile } from "@/features/settings/actions";
import { businessProfileSchema } from "@/features/settings/schemas";
import type { z } from "zod";

interface ProfileFormProps {
  initialName: string;
}

type FormValues = z.infer<typeof businessProfileSchema>;

export function ProfileForm({ initialName }: ProfileFormProps) {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input
                  disabled={isPending}
                  placeholder="Enter your business name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? "Saving..." : "Save Changes"}
            {!isPending && <Save className="ml-1.5 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
