"use client";

import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <PageHeader title="Terms of Service" onBack={() => router.back()} />
      <Section className="prose prose-sm dark:prose-invert">
        <p className="text-muted-foreground">Last updated: August 2026</p>

        <h3 className="text-lg font-semibold mt-6 mb-2">
          1. Agreement to Terms
        </h3>
        <p className="text-muted-foreground mb-4">
          By accessing or using our services, you agree to be bound by these
          Terms of Service and all applicable laws and regulations.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">2. User Accounts</h3>
        <p className="text-muted-foreground mb-4">
          You are responsible for safeguarding the credentials that you use to
          access the Service and for any activities or actions under your
          account.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">3. Acceptable Use</h3>
        <p className="text-muted-foreground mb-4">
          You agree not to use the Service in any way that violates any
          applicable federal, state, local, or international law or regulation.
        </p>
      </Section>
    </ScreenContainer>
  );
}
