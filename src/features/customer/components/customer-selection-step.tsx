"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
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
import posthog from "posthog-js";
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

  const phoneValue = useWatch({
    control: searchForm.control,
    name: "phone",
  });
  const [lastSearchedPhone, setLastSearchedPhone] = useState("");

  useEffect(() => {
    // Only search if we have 10 digits, it's a new number, and we're not already searching
    if (
      phoneValue.length === 10 &&
      phoneValue !== lastSearchedPhone &&
      searchResult.status !== "searching"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

      posthog.capture("customer_created");
      handleSelectCustomer(result.data);
    });
  }

  function handleSelectCustomer(customer: Customer) {
    posthog.capture("customer_selected", {
      customer_total_visits: customer.total_visits,
    });
    setCustomer({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    });
    setStep("catalog");
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Select Customer" subtitle="Step 1 of 3" />

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
                      <div className="absolute inset-y-0 left-[16px] flex items-center pointer-events-none text-[var(--color-text-tertiary)] font-medium">
                        +91
                      </div>
                      <Input
                        placeholder="9000000000"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        className="pl-[48px] h-[60px] bg-card border-2 border-border/60 focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] rounded-[var(--radius-input)] text-[17px] font-medium outline-none transition-all shadow-[var(--shadow-soft)]"
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
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 relative pb-[120px]">
            <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] shadow-[var(--shadow-soft)] relative overflow-hidden">
              {/* Success accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-success rounded-r-full" />

              <div className="flex items-start justify-between mb-[var(--spacing-sm)] pl-[var(--spacing-s)]">
                <div className="flex items-center gap-[var(--spacing-s)]">
                  <div className="w-[44px] h-[44px] rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-primary font-bold text-[17px]">
                    {searchResult.data.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[17px] text-[var(--color-text-primary)] leading-tight">
                      {searchResult.data.name || "Unknown Name"}
                    </h3>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-[2px]">
                      {searchResult.data.phone}
                    </p>
                  </div>
                </div>
                <span className="bg-[var(--color-success-light)] text-success text-[10px] font-bold px-[10px] py-[4px] rounded-full uppercase tracking-wider">
                  Found
                </span>
              </div>

              <div className="grid grid-cols-2 gap-[var(--spacing-sm)] py-[var(--spacing-sm)] border-t border-border/20 pl-[var(--spacing-s)]">
                <div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-[4px]">
                    Total Visits
                  </p>
                  <p className="font-bold text-[16px] text-[var(--color-text-primary)]">
                    {searchResult.data.total_visits}
                  </p>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-[var(--spacing-md)] pb-[calc(var(--spacing-md)+env(safe-area-inset-bottom,0px))] bg-background/80 backdrop-blur-xl border-t border-border/30 z-10">
                <div className="max-w-[768px] mx-auto w-full">
                  <Button
                    size="full"
                    className="w-full h-[56px] text-[16px] font-semibold rounded-[var(--radius-button)] shadow-[0_4px_16px_rgba(79,70,229,0.3)] active:scale-[0.97] transition-all"
                    onClick={() => handleSelectCustomer(searchResult.data!)}
                  >
                    Continue with{" "}
                    {searchResult.data.name?.split(" ")[0] || "Customer"}
                    <CheckCircle className="ml-2 size-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State -> Create Customer */}
        {searchResult.status === "not_found" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 pb-[120px]">
            <div className="bg-card rounded-[var(--radius-card)] p-[var(--spacing-md)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-[var(--spacing-s)] mb-[var(--spacing-sm)]">
                <div className="w-[44px] h-[44px] rounded-full bg-surface flex items-center justify-center text-[20px]">
                  ❔
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] text-[var(--color-text-primary)] leading-tight">
                    New Customer
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-[2px]">
                    +91 {phoneValue}
                  </p>
                </div>
              </div>

              <div className="pt-[var(--spacing-sm)] border-t border-border/20">
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
                          <FormLabel className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                            Name (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Rahul Kumar"
                              className="h-[48px] px-[16px] bg-surface border-2 border-transparent focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] rounded-[var(--radius-input)] text-[15px] font-medium outline-none transition-all"
                              autoComplete="name"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-[8px] leading-relaxed">
                            This customer will be saved automatically when the
                            visit completes.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="fixed bottom-0 left-0 right-0 p-[var(--spacing-md)] pb-[calc(var(--spacing-md)+env(safe-area-inset-bottom,0px))] bg-background/80 backdrop-blur-xl border-t border-border/30 z-10">
                      <div className="max-w-[768px] mx-auto w-full">
                        <Button
                          type="submit"
                          size="full"
                          className="w-full h-[56px] text-[16px] font-semibold rounded-[var(--radius-button)] shadow-[0_4px_16px_rgba(79,70,229,0.3)] active:scale-[0.97] transition-all"
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 size-5 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 size-5" />
                          )}
                          Continue
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
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
