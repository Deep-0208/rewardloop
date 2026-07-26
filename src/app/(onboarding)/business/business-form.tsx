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
  FormDescription,
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
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";

import { createBusiness } from "@/features/onboarding/actions/create-business";
import {
  createBusinessSchema,
  type CreateBusinessInput,
} from "@/features/onboarding/schemas";

const BUSINESS_TYPES = [
  { label: "Salon", value: "salon" },
  { label: "Spa", value: "spa" },
  { label: "Gym", value: "gym" },
  { label: "Cafe", value: "cafe" },
  { label: "Clinic", value: "clinic" },
  { label: "Car Wash", value: "car_wash" },
  { label: "Other", value: "other" },
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

const TEMPLATES: Record<
  BusinessType,
  {
    services: { name: string; price: number }[];
    products: { name: string; price: number }[];
  }
> = {
  salon: {
    services: [
      { name: "Men's Haircut", price: 30000 },
      { name: "Women's Haircut", price: 60000 },
      { name: "Hair Color", price: 150000 },
    ],
    products: [
      { name: "Premium Shampoo", price: 80000 },
      { name: "Hair Serum", price: 50000 },
    ],
  },
  spa: {
    services: [
      { name: "Full Body Massage", price: 200000 },
      { name: "Facial", price: 120000 },
    ],
    products: [
      { name: "Essential Oil", price: 60000 },
      { name: "Body Scrub", price: 75000 },
    ],
  },
  gym: {
    services: [
      { name: "Monthly Membership", price: 200000 },
      { name: "Personal Training", price: 100000 },
    ],
    products: [
      { name: "Protein Powder", price: 300000 },
      { name: "Energy Bar", price: 15000 },
    ],
  },
  cafe: {
    services: [
      { name: "Latte", price: 20000 },
      { name: "Cappuccino", price: 20000 },
    ],
    products: [
      { name: "Coffee Beans 250g", price: 45000 },
      { name: "Ceramic Mug", price: 30000 },
    ],
  },
  clinic: {
    services: [
      { name: "Consultation", price: 50000 },
      { name: "Follow-up", price: 30000 },
    ],
    products: [{ name: "Vitamin Supplements", price: 60000 }],
  },
  car_wash: {
    services: [
      { name: "Basic Wash", price: 30000 },
      { name: "Premium Detailing", price: 150000 },
    ],
    products: [
      { name: "Car Wax", price: 50000 },
      { name: "Microfiber Towel", price: 15000 },
    ],
  },
  other: {
    services: [{ name: "Standard Service", price: 50000 }],
    products: [{ name: "Standard Product", price: 50000 }],
  },
};

export function BusinessForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);

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
    setServerError(null);
    startTransition(async () => {
      const result = await createBusiness(values);
      if (!result.success) {
        setServerError(result.error ?? "An unexpected error occurred.");
        return;
      }
      router.push("/dashboard");
    });
  };

  const addService = () => {
    const current = form.getValues("services") || [];
    form.setValue("services", [...current, { name: "", price: 0 }]);
  };

  const addProduct = () => {
    const current = form.getValues("products") || [];
    form.setValue("products", [...current, { name: "", price: 0 }]);
  };

  const removeService = (index: number) => {
    const current = form.getValues("services") || [];
    form.setValue(
      "services",
      current.filter((_, i) => i !== index),
    );
  };

  const removeProduct = (index: number) => {
    const current = form.getValues("products") || [];
    form.setValue(
      "products",
      current.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step === i
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : step > i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
            </div>
            <span className="text-xs font-medium text-muted-foreground hidden sm:block">
              {i === 1 ? "Details" : i === 2 ? "Rewards" : "Catalog"}
            </span>
          </div>
        ))}
        <div className="absolute left-[20%] right-[20%] top-4 -z-10 h-[2px] bg-muted sm:top-8" />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 relative"
        >
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in-0 duration-300">
              <div className="space-y-1 mb-6 text-center sm:text-left">
                <h3 className="text-lg font-semibold">Shop Details</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us about your business.
                </p>
              </div>
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in-0 duration-300">
              <div className="space-y-1 mb-6 text-center sm:text-left">
                <h3 className="text-lg font-semibold flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Reward Rules
                </h3>
                <p className="text-sm text-muted-foreground">
                  How will customers earn and redeem rewards?
                </p>
              </div>

              <FormField
                control={form.control}
                name="reward_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Earning Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      The percentage of their bill customers get back as
                      rewards. (e.g. 10%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_redeem_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Redemption Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      The maximum percentage of a bill that can be paid with
                      rewards. (e.g. 50% means they must pay half in cash).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in-0 duration-300">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">Catalog Setup</h3>
                <p className="text-sm text-muted-foreground">
                  We pre-filled some items for you. Add or remove them as
                  needed. All prices are in Rupees.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-primary">Services</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addService}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Service
                  </Button>
                </div>

                {form.watch("services")?.map((service, index) => (
                  <div
                    key={`service-${index}`}
                    className="flex items-center gap-3 bg-muted/50 p-3 rounded-md"
                  >
                    <Input
                      value={service.name}
                      onChange={(e) => {
                        const services = form.getValues("services") || [];
                        const service = services[index];
                        if (service) {
                          service.name = e.target.value;
                          form.setValue("services", services);
                        }
                      }}
                      placeholder="Service Name"
                      className="flex-1"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={service.price / 100}
                        onChange={(e) => {
                          const services = form.getValues("services") || [];
                          const service = services[index];
                          if (service) {
                            service.price =
                              (parseFloat(e.target.value) || 0) * 100;
                            form.setValue("services", services);
                          }
                        }}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService(index)}
                      className="text-destructive h-10 w-10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.watch("services")?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    No services added.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-primary">Products</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduct}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                  </Button>
                </div>

                {form.watch("products")?.map((product, index) => (
                  <div
                    key={`product-${index}`}
                    className="flex items-center gap-3 bg-muted/50 p-3 rounded-md"
                  >
                    <Input
                      value={product.name}
                      onChange={(e) => {
                        const products = form.getValues("products") || [];
                        const product = products[index];
                        if (product) {
                          product.name = e.target.value;
                          form.setValue("products", products);
                        }
                      }}
                      placeholder="Product Name"
                      className="flex-1"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={product.price / 100}
                        onChange={(e) => {
                          const products = form.getValues("products") || [];
                          const product = products[index];
                          if (product) {
                            product.price =
                              (parseFloat(e.target.value) || 0) * 100;
                            form.setValue("products", products);
                          }
                        }}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(index)}
                      className="text-destructive h-10 w-10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.watch("products")?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    No products added.
                  </p>
                )}
              </div>
            </div>
          )}

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between pt-4 gap-4">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="flex-1">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Setting up..." : "Complete Setup"}
                {!isPending && <Gift className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
