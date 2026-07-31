import { UseFormReturn } from "react-hook-form";
import {
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
import { CreateBusinessInput } from "@/features/onboarding/schemas";
import { BUSINESS_TYPES } from "@/features/onboarding/constants";

interface ShopDetailsStepProps {
  form: UseFormReturn<CreateBusinessInput>;
  isPending: boolean;
}

export function ShopDetailsStep({ form, isPending }: ShopDetailsStepProps) {
  return (
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
  );
}
