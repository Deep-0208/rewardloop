"use client";

import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <PageHeader title="Privacy Policy" onBack={() => router.back()} />
      <Section className="prose prose-sm dark:prose-invert">
        <p className="text-muted-foreground">Last updated: August 2026</p>

        <h3 className="text-lg font-semibold mt-6 mb-2">
          1. Information We Collect
        </h3>
        <p className="text-muted-foreground mb-4">
          We collect information that you provide directly to us, including your
          phone number during registration, and details of transactions you
          process.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">
          2. How We Use Your Data
        </h3>
        <p className="text-muted-foreground mb-4">
          We use your data to provide, maintain, and improve our services,
          process transactions, and send authentication codes (OTPs).
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">3. Data Sharing</h3>
        <p className="text-muted-foreground mb-4">
          We do not sell your personal information. We may share information
          with third-party vendors (such as Twilio and Supabase) solely for the
          purpose of operating our service.
        </p>
      </Section>
    </ScreenContainer>
  );
}
