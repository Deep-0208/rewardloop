import { BusinessForm } from "./business-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gift } from "@/components/icons";

export const metadata = {
  title: "Setup Your Business | RewardLoop",
  description: "Complete your business setup to get started with RewardLoop.",
};

export default function BusinessOnboardingPage() {
  return (
    <Card className="w-[576px] max-w-full border-border/50 shadow-[var(--shadow-float)]">
      <CardHeader className="space-y-4 text-center pb-2">
        {/* Brand icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-hero)]">
          <Gift className="h-7 w-7 text-primary-foreground" strokeWidth={1.8} />
        </div>

        <div className="space-y-1.5">
          <CardTitle className="text-[22px] font-bold tracking-tight">
            Welcome to RewardLoop
          </CardTitle>
          <CardDescription className="text-[14px] leading-relaxed text-muted-foreground">
            Let&apos;s set up your business profile to get started.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <BusinessForm />
      </CardContent>
    </Card>
  );
}
