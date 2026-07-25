"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  User,
  Phone,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Loader2,
} from "@/components/icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { searchCustomer } from "../actions/search-customer";
import { createCustomer } from "../actions/create-customer";
import { useBillingStore } from "@/stores/billing-store";
import type { Customer } from "../types";

const searchFormSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
});

const createFormSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
  name: z.string().optional(),
});

export function CustomerSelectionStep() {
  const setStep = useBillingStore((s) => s.setStep);
  const setCustomer = useBillingStore((s) => s.setCustomer);
  const selectedCustomer = useBillingStore((s) => s.customer);

  const [isPending, startTransition] = useTransition();
  const [searchResult, setSearchResult] = useState<{
    status: "idle" | "searching" | "found" | "not_found" | "error";
    data?: Customer;
    error?: string;
  }>({ status: "idle" });

  const searchForm = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: { phone: selectedCustomer?.phone.replace("+91", "") || "" },
  });

  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { phone: "", name: "" },
  });

  const handleSearch = useCallback(
    (values: z.infer<typeof searchFormSchema>) => {
      setSearchResult({ status: "searching" });
      const formattedPhone = `+91${values.phone}`;

      startTransition(async () => {
        const result = await searchCustomer({ phone: formattedPhone });
        if (!result.success) {
          setSearchResult({ status: "error", error: result.error });
          return;
        }

        if (result.data) {
          setSearchResult({ status: "found", data: result.data });
        } else {
          setSearchResult({ status: "not_found" });
          createForm.setValue("phone", values.phone);
        }
      });
    },
    [createForm],
  );

  const phoneValue = searchForm.watch("phone");
  const [lastSearchedPhone, setLastSearchedPhone] = useState("");

  useEffect(() => {
    // Only search if we have 10 digits, it's a new number, and we're not already searching
    if (
      phoneValue.length === 10 &&
      phoneValue !== lastSearchedPhone &&
      searchResult.status !== "searching"
    ) {
      setLastSearchedPhone(phoneValue);
      handleSearch({ phone: phoneValue });
    }
    // Reset to idle if the user deletes characters below 10 digits
    else if (phoneValue.length < 10 && searchResult.status !== "idle") {
      setSearchResult({ status: "idle" });
      setLastSearchedPhone("");
    }
  }, [phoneValue, lastSearchedPhone, searchResult.status, handleSearch]);

  function handleCreate(values: z.infer<typeof createFormSchema>) {
    setSearchResult({ status: "searching" });
    const formattedPhone = `+91${values.phone}`;

    startTransition(async () => {
      const result = await createCustomer({
        phone: formattedPhone,
        name: values.name,
      });

      if (!result.success) {
        setSearchResult({ status: "error", error: result.error });
        return;
      }

      handleSelectCustomer(result.data);
    });
  }

  function handleSelectCustomer(customer: Customer) {
    setCustomer({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    });
    setStep("catalog");
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Select Customer" subtitle="Step 1 of 4" />

      <div
        className="flex flex-1 flex-col px-4 py-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Search Section */}
        <Form {...searchForm}>
          <form
            onSubmit={searchForm.handleSubmit(handleSearch)}
            className="space-y-4"
          >
            <FormField
              control={searchForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Mobile Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground font-medium">
                        +91
                      </div>
                      <Input
                        placeholder="9000000000"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        className="pl-12 h-14 text-lg font-medium"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {searchResult.status === "idle" && (
              <Button
                type="submit"
                size="full"
                disabled={phoneValue.length !== 10}
              >
                Search Customer
              </Button>
            )}
          </form>
        </Form>

        {/* Searching State */}
        {searchResult.status === "searching" && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-in fade-in">
            <Loader2 className="size-8 animate-spin text-primary mb-4" />
            <p>Looking up customer...</p>
          </div>
        )}

        {/* Found State */}
        {searchResult.status === "found" && searchResult.data && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="surface-elevated p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {searchResult.data.name || "Unknown Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="size-3.5" />
                    {searchResult.data.phone}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {searchResult.data.total_visits}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Visits
                  </div>
                </div>
              </div>
              <Button
                size="full"
                className="mt-6"
                onClick={() => handleSelectCustomer(searchResult.data!)}
              >
                <CheckCircle className="mr-2 size-5" />
                Select & Continue
              </Button>
            </div>
          </div>
        )}

        {/* Not Found State -> Create Customer */}
        {searchResult.status === "not_found" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="rounded-[var(--radius-card)] border border-dashed p-6 bg-muted/30">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <UserPlus className="size-6" />
                </div>
                <h3 className="font-semibold text-lg">New Customer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This phone number is not registered. Add a name (optional) to
                  create them.
                </p>
              </div>

              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreate)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Priya Sharma"
                            className="h-14"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="full"
                    className="mt-2"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 size-5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 size-5" />
                    )}
                    Create & Select
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}

        {/* Error State */}
        {searchResult.status === "error" && (
          <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">
              {searchResult.error || "An unexpected error occurred."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
