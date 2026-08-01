import type { Metadata } from "next";
import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Privacy Policy | RewardLoop",
  description:
    "Privacy Policy for RewardLoop, outlining data collection, usage, and security practices.",
  openGraph: {
    title: "Privacy Policy | RewardLoop",
    description:
      "Privacy Policy for RewardLoop, outlining data collection, usage, and security practices.",
  },
};

export default function PrivacyPage() {
  return (
    <ScreenContainer>
      <PageHeader
        title="Privacy Policy"
        subtitle="Data privacy & security practices"
        backTo="/"
      />

      <Section className="pb-24">
        <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-6 sm:p-10 mb-12 mt-2">
          <div className="max-w-[700px] mx-auto space-y-10">
            <div className="mb-2">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-primary/60"></span>
                Last Updated: August 2026 • Version 1.0
              </p>
            </div>

            <nav className="p-5 bg-muted/30 rounded-xl border border-border/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Contents
              </h2>
              <ul className="flex flex-col gap-3 text-[14px]">
                <li>
                  <a
                    href="#what-we-collect"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    1. What Data We Collect
                  </a>
                </li>
                <li>
                  <a
                    href="#what-we-dont-collect"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    2. What We DO NOT Collect
                  </a>
                </li>
                <li>
                  <a
                    href="#how-we-use"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    3. How We Use Your Data
                  </a>
                </li>
                <li>
                  <a
                    href="#third-parties"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    4. Third-Party Services
                  </a>
                </li>
                <li>
                  <a
                    href="#cookies"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    5. Cookies & Session Usage
                  </a>
                </li>
                <li>
                  <a
                    href="#security"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    6. Data Security
                  </a>
                </li>
                <li>
                  <a
                    href="#data-ownership"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    7. Data Ownership & Retention
                  </a>
                </li>
                <li>
                  <a
                    href="#children"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    8. Children&apos;s Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  >
                    9. Contact Us
                  </a>
                </li>
              </ul>
            </nav>

            <section id="what-we-collect" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                1. What Data We Collect
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  To provide our SaaS loyalty platform, we collect specific
                  types of information:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                  <li>
                    <strong className="text-foreground">
                      Business Information:
                    </strong>{" "}
                    Shop name, owner name, business mobile number, and optional
                    business address.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Customer Information:
                    </strong>{" "}
                    Customer mobile number, optional customer name, reward
                    balances, and visit/transaction history.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Transaction Information:
                    </strong>{" "}
                    Services rendered, bill amounts, rewards earned/redeemed,
                    payment method logged, and timestamps.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      System Information:
                    </strong>{" "}
                    IP addresses, browser type, device information, session
                    logs, and error logs to maintain system health.
                  </li>
                </ul>
              </div>
            </section>

            <section id="what-we-dont-collect" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                2. What We DO NOT Collect
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  We operate on a principle of data minimization. We absolutely{" "}
                  <strong className="text-foreground">DO NOT</strong> store:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                  <li>Passwords (we use passwordless OTP).</li>
                  <li>Credit card numbers or bank credentials.</li>
                  <li>UPI PINs or payment processing details.</li>
                  <li>Biometric information or Government ID documents.</li>
                  <li>
                    Sensitive personal information unless explicitly mandated by
                    law.
                  </li>
                </ul>
              </div>
            </section>

            <section id="how-we-use" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                3. How We Use Your Data
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  We use the collected information solely to operate, maintain,
                  and improve the RewardLoop platform. This includes: verifying
                  identities via OTP, calculating reward balances, providing
                  business analytics, securing the platform against abuse, and
                  resolving technical issues.
                </p>
              </div>
            </section>

            <section id="third-parties" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                4. Third-Party Services
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  RewardLoop integrates with trusted third-party service
                  providers to function. These providers may process limited
                  data strictly necessary to deliver their services. Current and
                  planned integrations include:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                  <li>
                    <strong className="text-foreground">Supabase:</strong> For
                    database hosting and authentication.
                  </li>
                  <li>
                    <strong className="text-foreground">SMS Providers:</strong>{" "}
                    To deliver OTPs and transactional notifications.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Cloud Providers:
                    </strong>{" "}
                    For secure application hosting.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Analytics Providers:
                    </strong>{" "}
                    To track application performance and errors.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Future Integrations:
                    </strong>{" "}
                    WhatsApp messaging providers for customer engagement.
                  </li>
                </ul>
              </div>
            </section>

            <section id="cookies" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                5. Cookies & Session Usage
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  We use strictly necessary cookies to keep your session secure
                  and functional. We use{" "}
                  <strong className="text-foreground">session cookies</strong>{" "}
                  to maintain your login state,{" "}
                  <strong className="text-foreground">
                    authentication cookies
                  </strong>{" "}
                  to identify your account, and{" "}
                  <strong className="text-foreground">security cookies</strong>{" "}
                  to prevent fraud. We may also use{" "}
                  <strong className="text-foreground">
                    performance cookies
                  </strong>{" "}
                  to identify application bottlenecks. We do NOT use invasive
                  advertising or third-party tracking cookies.
                </p>
              </div>
            </section>

            <section id="security" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                6. Data Security
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  We employ reasonable security practices to protect your data,
                  including HTTPS for encrypted communication, strict
                  authentication, and database-level access controls. However,
                  no internet transmission is 100% secure, and we cannot
                  guarantee absolute security of your information.
                </p>
              </div>
            </section>

            <section id="data-ownership" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                7. Data Ownership & Retention
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  As a salon owner, you own your business data and the customer
                  records you generate. RewardLoop merely acts as the software
                  provider and data processor. If a customer wishes to correct
                  or delete their data, they must request this through your
                  salon. You may request full deletion of your business account
                  and associated data by contacting our support team.
                </p>
              </div>
            </section>

            <section id="children" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                8. Children&apos;s Privacy
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  RewardLoop is a B2B platform intended strictly for business
                  users. The service is not directed toward children under the
                  age of 18, and we do not knowingly collect personal data from
                  minors.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">
                9. Contact Us
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground bg-muted/20 p-5 rounded-xl border border-border/50">
                <p>
                  For any privacy-related concerns or data requests, please
                  contact our privacy team:
                </p>
                <p className="flex items-center gap-2">
                  <strong className="text-foreground">Email:</strong>
                  <a
                    href="mailto:privacy@rewardloop.app"
                    className="font-semibold text-primary hover:underline"
                  >
                    privacy@rewardloop.app
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </Section>
    </ScreenContainer>
  );
}
