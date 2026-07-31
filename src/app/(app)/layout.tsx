import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { PostHogIdentify } from "@/components/posthog-identify";

/**
 * App layout — wraps all main application pages.
 * Provides the AppShell container and active-route persistent BottomNavigation.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userId: string | null = null;
  let phone: string | null = null;
  let role: string | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, phone, role")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (dbUser) {
      userId = dbUser.id as string;
      phone = dbUser.phone as string;
      role = dbUser.role as string;
    }
  }

  return (
    <AppShell>
      <PostHogIdentify userId={userId} phone={phone} role={role} />
      {children}
      <BottomNav />
    </AppShell>
  );
}
