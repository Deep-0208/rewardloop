"use client";

import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import {
  Heading,
  Title,
  Subtitle,
  Body,
  Label,
  Caption,
  Tiny,
  Display,
} from "@/components/typography";
import { Button } from "@/components/ui/button";
import {
  FormField,
  PhoneInput,
  OTPInput,
  NumberInput,
  SearchInput,
} from "@/components/forms";
import { Stack, Spacer } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/feedback";
import {
  StatCard,
  ServiceCard,
  CustomerCard,
  RewardCard,
  TransactionCard,
} from "@/features/shared/components";
import { Users } from "@/components/icons";
import { BottomNavigation } from "@/components/navigation";

/**
 * Design System Showcase
 *
 * Exclusively available in development mode for visual QA.
 * Validates typography, colors, components, and responsive behavior.
 */
export default function DesignSystemPage() {
  // Enforce development only route
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-6">
        <Stack gap={8}>
          <div className="border-b pb-4">
            <Heading>RewardLoop Design System</Heading>
            <Body muted className="mt-2">
              Development-only showcase for UI components and tokens.
            </Body>
          </div>

          <section>
            <Title className="mb-4">1. Typography</Title>
            <Stack gap={4} className="rounded-xl border p-4">
              <Display>Display (32px)</Display>
              <Heading>Heading (28px)</Heading>
              <Title>Title (24px)</Title>
              <Subtitle>Subtitle (20px)</Subtitle>
              <Body>Body (16px) - Default text</Body>
              <Label>Label (14px) - Forms and inputs</Label>
              <Caption>Caption (12px) - Secondary text</Caption>
              <Tiny>Tiny (11px) - Metadata</Tiny>
            </Stack>
          </section>

          <section>
            <Title className="mb-4">2. Buttons</Title>
            <Stack gap={6} className="rounded-xl border p-4">
              <div>
                <Subtitle className="mb-2">Variants</Subtitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                </div>
              </div>

              <div>
                <Subtitle className="mb-2">Sizes & States</Subtitle>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="touch">Touch (48px)</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </Stack>
          </section>

          <section>
            <Title className="mb-4">3. Inputs & Forms</Title>
            <Stack gap={4} className="rounded-xl border p-4">
              <FormField label="Standard Input" placeholder="Enter text" />
              <FormField
                label="Input with Error"
                placeholder="Enter text"
                error="This field is required"
              />
              <PhoneInput />
              <NumberInput label="Amount" prefix="₹" placeholder="0" />
              <SearchInput placeholder="Search customers..." />
              <div>
                <Label>OTP Input</Label>
                <Spacer size={2} />
                <OTPInput autoFocus={false} />
              </div>
            </Stack>
          </section>

          <section>
            <Title className="mb-4">4. Feedback</Title>
            <Stack gap={4}>
              <div className="rounded-xl border overflow-hidden">
                <EmptyState
                  title="No Data"
                  description="There is no data to show at this moment."
                />
              </div>
              <div className="rounded-xl border overflow-hidden">
                <ErrorState />
              </div>
            </Stack>
          </section>

          <section>
            <Title className="mb-4">5. Business Primitives</Title>
            <Stack gap={4}>
              <StatCard label="Today's Revenue" value="₹12,450" icon={Users} />
              <ServiceCard name="Haircut + Beard Trim" price="₹450" />
              <ServiceCard name="Haircut + Beard Trim" price="₹450" selected />
              <CustomerCard
                name="Rahul Sharma"
                phone="+91 98765 43210"
                visitCount={5}
                walletBalance="₹250"
              />
              <RewardCard
                availableBalance="₹500"
                maxRedeem="₹200"
                appliedAmount="₹150"
                finalPay="₹850"
              />
              <TransactionCard
                customerName="Rahul Sharma"
                finalPaid="₹850"
                rewardUsed="₹150"
                paymentMethod="online"
                timestamp="10:45 AM"
              />
            </Stack>
          </section>

          <section>
            <Title className="mb-4">6. Navigation & Layout Controls</Title>
            <div className="relative h-24 rounded-xl border bg-muted/20 overflow-hidden flex items-center justify-center p-4">
              <span className="text-xs text-muted-foreground mb-12">
                Floating Bottom Navigation Bar:
              </span>
              <BottomNavigation
                items={[
                  { key: "home", label: "Home", icon: Users, active: true },
                  { key: "visit", label: "Add Visit", icon: Users },
                  { key: "more", label: "More", icon: Users },
                ]}
                className="absolute bottom-2 translate-x-0 left-auto"
              />
            </div>
          </section>
        </Stack>
      </div>
    </AppShell>
  );
}
