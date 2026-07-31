import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getSettings } from "@/features/settings/actions";
import { ProfileForm } from "./profile-form";
import { ErrorState } from "@/components/ui/feedback-states";

export default async function ProfilePage() {
  const result = await getSettings();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Business Profile" />
        <ErrorState
          title="Unable to load profile"
          description="Please check your connection and try again."
        />
      </ScreenContainer>
    );
  }

  const { profile } = result.data;

  return (
    <ScreenContainer>
      <PageHeader 
        title="Business Profile" 
        subtitle="Manage your business details" 
        backTo="/more" 
      />
      <Section>
        <ProfileForm initialName={profile.name} businessType={profile.businessType} />
      </Section>
    </ScreenContainer>
  );
}
