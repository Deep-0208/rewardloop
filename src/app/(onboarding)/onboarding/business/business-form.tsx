"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

import { createBusiness } from "@/features/onboarding/actions/create-business";
import {
  createBusinessSchema,
  type CreateBusinessInput,
} from "@/features/onboarding/schemas";
import { TEMPLATES, type BusinessType } from "@/features/onboarding/constants";

import { ShopDetailsStep } from "./components/shop-details-step";
import { RewardRulesStep } from "./components/reward-rules-step";
import { CatalogSetupStep } from "./components/catalog-setup-step";

const STEP_LABELS = ["Details", "Rewards", "Catalog"] as const;

export function BusinessForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => setCanSubmit(true), 500);
      return () => clearTimeout(timer);
    } else {
      setCanSubmit(false);
      return undefined;
    }
  }, [step]);

  const form = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      business_type: "salon",
      reward_percentage: 10,
      max_redeem_percentage: 100,
      services: [],
      products: [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchBusinessType = form.watch("business_type") as BusinessType;

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["name", "business_type"]);
      if (isValid) {
        // Load templates if empty
        const currentServices = form.getValues("services");
        const currentProducts = form.getValues("products");
        if (!currentServices || currentServices.length === 0) {
          form.setValue(
            "services",
            TEMPLATES[watchBusinessType]?.services || [],
          );
        }
        if (!currentProducts || currentProducts.length === 0) {
          form.setValue(
            "products",
            TEMPLATES[watchBusinessType]?.products || [],
          );
        }
      }
    } else if (step === 2) {
      isValid = await form.trigger([
        "reward_percentage",
        "max_redeem_percentage",
      ]);
    }

    if (isValid) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const onSubmit = (values: CreateBusinessInput) => {
    if (step !== 3) {
      handleNext();
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await createBusiness(values);
      if (!result.success) {
        setServerError(result.error ?? "An unexpected error occurred.");
        return;
      }
      router.replace("/dashboard");
    });
  };

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between px-2">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isComplete = step > stepNum;

          return (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-initial"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground ring-[3px] ring-primary/20 shadow-[var(--shadow-hero)]"
                      : isComplete
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEP_LABELS.length - 1 && (
                <div className="flex-1 mx-3 mt-[-18px]">
                  <div
                    className={`h-[2px] w-full rounded-full transition-colors duration-300 ${
                      step > stepNum ? "bg-primary" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step content with transition */}
          <div className="animate-fade-in" key={step}>
            {step === 1 && (
              <ShopDetailsStep form={form} isPending={isPending} />
            )}

            {step === 2 && (
              <RewardRulesStep form={form} isPending={isPending} />
            )}

            {step === 3 && <CatalogSetupStep form={form} />}
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 pt-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleBack}
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}

            {step < 3 ? (
              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                className="flex-1"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                disabled={isPending || !canSubmit}
                className="flex-1"
              >
                {isPending ? "Setting up..." : "Complete Setup"}
                {!isPending && <Gift className="ml-1.5 h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
