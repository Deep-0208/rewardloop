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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift } from "@/components/icons";

import {
  createBusiness,
  createBusinessSchema,
  type CreateBusinessInput,
} from "@/features/onboarding/actions/create-business";

const BUSINESS_TYPES = [
  { label: "Salon", value: "salon" },
  { label: "Spa", value: "spa" },
  { label: "Gym", value: "gym" },
  { label: "Cafe", value: "cafe" },
  { label: "Clinic", value: "clinic" },
  { label: "Car Wash", value: "car_wash" },
  { label: "Other", value: "other" },
];

export function BusinessForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      business_type: "salon",
    },
  });

  const onSubmit = (values: CreateBusinessInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createBusiness(values);
      if (!result.success) {
        setServerError(result.error ?? "An unexpected error occurred.");
        return;
      }

      // Successfully created, route to dashboard
      router.push("/dashboard");
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
                  placeholder="e.g. Acme Studio"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="business_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Type</FormLabel>
              <Select
                disabled={isPending}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            "Setting up..."
          ) : (
            <span className="flex items-center gap-2">
              Continue to Dashboard <Gift className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
