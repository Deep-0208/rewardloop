import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getSettings } from "@/features/settings/actions";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const result = await getSettings();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Business Profile" />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load profile. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  const { profile } = result.data;

  return (
    <ScreenContainer>
      <PageHeader title="Business Profile" />
      <Section>
        <ProfileForm initialName={profile.name} />
      </Section>
    </ScreenContainer>
  );
}
