import { BusinessForm } from "./business-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Store } from "@/components/icons";

export const metadata = {
  title: "Setup Your Business | RewardLoop",
  description: "Complete your business setup to get started with RewardLoop.",
};

export default function BusinessOnboardingPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to RewardLoop
            </CardTitle>
            <CardDescription className="text-sm">
              Let&apos;s set up your business profile to get started.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BusinessForm />
        </CardContent>
      </Card>
    </div>
  );
}
