"use client";

import React from "react";

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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormField,
  PhoneInput,
  NumberInput,
  SearchInput,
} from "@/components/forms";
import { OTPInput } from "@/features/auth/components/otp-input";
import { Stack, Spacer } from "@/components/layout";
import { EmptyState, ErrorState } from "@/components/ui/feedback-states";
import {
  StatCard,
  ServiceCard,
  CustomerCard,
  RewardCard,
  TransactionCard,
} from "@/features/shared/components";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Users } from "lucide-react";

// --- Props Documentation Helper ---
function PropsTable({
  propsData,
}: {
  propsData: Array<{ prop: string; type: string; default?: string; desc: string }>;
}) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-card mt-4">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            <th className="font-medium p-3">Prop</th>
            <th className="font-medium p-3">Type</th>
            <th className="font-medium p-3">Default</th>
            <th className="font-medium p-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {propsData.map((p, i) => (
            <tr key={i} className="hover:bg-muted/20">
              <td className="p-3 font-mono text-[var(--color-primary)]">
                {p.prop}
              </td>
              <td className="p-3 font-mono text-muted-foreground">{p.type}</td>
              <td className="p-3 font-mono">{p.default || "-"}</td>
              <td className="p-3 text-muted-foreground">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
                  <Button size="lg">Large (48px)</Button>
                  <Button size="icon">Icon</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
              <PropsTable
                propsData={[
                  { prop: "variant", type: "string", default: '"default"', desc: "Visual style variant (default, outline, ghost, etc)" },
                  { prop: "size", type: "string", default: '"default"', desc: "Size variant (default, sm, lg, icon)" },
                  { prop: "loading", type: "boolean", default: "false", desc: "Displays a spinner and disables the button" },
                  { prop: "leftIcon", type: "ReactNode", desc: "Icon placed before the text" },
                  { prop: "rightIcon", type: "ReactNode", desc: "Icon placed after the text" },
                ]}
              />
            </Stack>
          </section>

          <section>
            <Title className="mb-4">2b. Core Primitives (Input, Checkbox, Badge)</Title>
            <Stack gap={6} className="rounded-xl border p-4 bg-muted/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <Label>Standard Input</Label>
                  <Input placeholder="Enter your name" />
                  
                  <Label className="mt-3">Input with Error State</Label>
                  <Input hasError placeholder="Enter your email" defaultValue="invalid@email" />
                  
                  <Label className="mt-3">Input with Icons</Label>
                  <Input 
                    placeholder="Search..." 
                    leftSection={<Users className="size-4 text-muted-foreground" />} 
                  />
                </div>
                
                <div className="flex flex-col gap-4">
                  <Label>Badges</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>

                  <Label className="mt-3">Checkbox</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="font-normal cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Accept terms and conditions
                    </label>
                  </div>
                </div>
              </div>
              
              <PropsTable
                propsData={[
                  { prop: "hasError", type: "boolean", default: "false", desc: "Input only: Applies error styling (red border/ring)" },
                  { prop: "leftSection", type: "ReactNode", desc: "Input only: Component rendered inside the left side of the input" },
                  { prop: "rightSection", type: "ReactNode", desc: "Input only: Component rendered inside the right side of the input" },
                ]}
              />
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
              <BottomNav />
            </div>
          </section>
        </Stack>
      </div>
    </AppShell>
  );
}
