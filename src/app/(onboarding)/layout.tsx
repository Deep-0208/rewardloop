/**
 * Onboarding layout — wraps setup flow pages.
 *
 * No AppShell. No bottom navigation. Full-width responsive layout
 * with subtle brand gradient background for premium first impression.
 */
export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="onboarding-bg flex min-h-dvh w-full items-center justify-center p-4 sm:p-6 md:p-8">
      {children}
    </div>
  );
}
