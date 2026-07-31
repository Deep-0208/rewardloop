import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { CreateBusinessInput } from "@/features/onboarding/schemas";

interface RewardRulesStepProps {
  form: UseFormReturn<CreateBusinessInput>;
  isPending: boolean;
}

export function RewardRulesStep({ form, isPending }: RewardRulesStepProps) {
  return (
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
                  field.onChange(e.target.value ? parseInt(e.target.value) : "")
                }
              />
            </FormControl>
            <FormDescription>
              The percentage of their bill customers get back as rewards. (e.g.
              10%)
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
                  field.onChange(e.target.value ? parseInt(e.target.value) : "")
                }
              />
            </FormControl>
            <FormDescription>
              The maximum percentage of a bill that can be paid with rewards.
              (e.g. 50% means they must pay half in cash).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
