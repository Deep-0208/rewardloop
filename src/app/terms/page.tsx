import type { Metadata } from "next";
import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";

export const metadata: Metadata = {
  title: "Terms of Service | RewardLoop",
  description: "Terms of Service for RewardLoop, the loyalty management PWA for salons and barbershops.",
  openGraph: {
    title: "Terms of Service | RewardLoop",
    description: "Terms of Service for RewardLoop, the loyalty management PWA for salons and barbershops.",
  },
};

export default function TermsPage() {
  return (
    <ScreenContainer>
      <PageHeader title="Terms of Service" backTo="/" />
      
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Contents</h2>
              <ul className="flex flex-col gap-3 text-[14px]">
                <li><a href="#agreement" className="font-semibold text-primary/80 hover:text-primary transition-colors">1. Agreement to Terms</a></li>
                <li><a href="#service" className="font-semibold text-primary/80 hover:text-primary transition-colors">2. The RewardLoop Service</a></li>
                <li><a href="#authentication" className="font-semibold text-primary/80 hover:text-primary transition-colors">3. Authentication & Access</a></li>
                <li><a href="#rewards" className="font-semibold text-primary/80 hover:text-primary transition-colors">4. Rewards System & Liability</a></li>
                <li><a href="#payments" className="font-semibold text-primary/80 hover:text-primary transition-colors">5. Payment Disclaimer</a></li>
                <li><a href="#responsibilities" className="font-semibold text-primary/80 hover:text-primary transition-colors">6. User Responsibilities</a></li>
                <li><a href="#termination" className="font-semibold text-primary/80 hover:text-primary transition-colors">7. Account Termination</a></li>
                <li><a href="#governing-law" className="font-semibold text-primary/80 hover:text-primary transition-colors">8. Governing Law</a></li>
                <li><a href="#contact" className="font-semibold text-primary/80 hover:text-primary transition-colors">9. Contact Us</a></li>
              </ul>
            </nav>

            <section id="agreement" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">1. Agreement to Terms</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  These Terms of Service constitute a legally binding agreement made between you ("Business Owner", "you") and RewardLoop ("we", "us", or "our"), concerning your access to and use of the RewardLoop Progressive Web App (PWA) and related services. By registering for or using RewardLoop, you agree that you have read, understood, and agreed to be bound by all of these Terms of Service.
                </p>
              </div>
            </section>

            <section id="service" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">2. The RewardLoop Service</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  RewardLoop provides subscription-based SaaS loyalty management software specifically designed for salon and barber shop owners. The platform allows businesses to manage customer loyalty, record visits, issue and redeem rewards, track transactions, and view business insights.
                </p>
                <p>
                  RewardLoop is provided exclusively as a Web PWA. There is no customer-facing mobile application. The system is designed to be operated solely by salon owners and their authorized staff.
                </p>
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">3. Authentication & Access</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  RewardLoop utilizes a passwordless authentication flow relying on mobile number and One-Time Password (OTP) verification. We enforce a strict single active session per device policy to ensure the security of your business data.
                </p>
                <p>
                  You are entirely responsible for maintaining the confidentiality of your mobile device and OTP codes. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </section>

            <section id="rewards" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">4. Rewards System & Liability</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  As a business owner, you are solely responsible for configuring your reward percentages, rules, and redemption criteria. Rewards issued through the platform belong to your business, not RewardLoop.
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                  <li>Rewards hold absolutely no cash value.</li>
                  <li>Rewards cannot be transferred between customers or businesses.</li>
                  <li>Rewards may expire if you configure expiration rules.</li>
                  <li>RewardLoop accepts no liability for disputes between your business and your customers regarding reward issuance, redemption, or expiration.</li>
                </ul>
              </div>
            </section>

            <section id="payments" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">5. Payment Disclaimer</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  RewardLoop is <strong className="text-foreground">NOT a payment gateway or payment processor</strong>. We do not process, hold, or transfer funds on behalf of your customers or your business.
                </p>
                <p>
                  All payments must be collected directly by your salon (e.g., via cash, your own card terminal, or personal UPI). RewardLoop merely provides a digital ledger to <i>record</i> these transactions for your analytical and loyalty-tracking purposes.
                </p>
              </div>
            </section>

            <section id="responsibilities" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">6. User Responsibilities</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>By using RewardLoop, you explicitly agree that you will:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-primary/50">
                  <li>Provide accurate and current information about your business.</li>
                  <li>Protect your OTP access and mobile device.</li>
                  <li>Not misuse, sell, or improperly expose your customers' data.</li>
                  <li>Not create fake transactions or abuse the reward system to artificially inflate metrics.</li>
                </ul>
              </div>
            </section>

            <section id="termination" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">7. Account Termination</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  We reserve the right to suspend or immediately terminate your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms. This includes, but is not limited to: fraud, reward abuse, illegal activity, spam, or repeated security violations.
                </p>
              </div>
            </section>

            <section id="governing-law" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">8. Governing Law</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  These Terms shall be governed by and defined following the laws of India. RewardLoop and yourself irrevocably consent that the courts of Gujarat, India shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h3 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border/30">9. Contact Us</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground bg-muted/20 p-5 rounded-xl border border-border/50">
                <p>If you have any questions concerning our Terms of Service, please contact us at:</p>
                <p className="flex items-center gap-2">
                  <strong className="text-foreground">Email:</strong> 
                  <a href="mailto:support@rewardloop.app" className="font-semibold text-primary hover:underline">support@rewardloop.app</a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </Section>
    </ScreenContainer>
  );
}
