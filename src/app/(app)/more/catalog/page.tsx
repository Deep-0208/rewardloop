import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getCatalogItems } from "@/features/settings/actions";
import { CatalogManagementContent } from "./catalog-content";

/**
 * Catalog Management page — CRUD for services/products.
 *
 * Server component that fetches all catalog items (including inactive)
 * and passes them to the interactive client component.
 */
export default async function CatalogManagementPage() {
  const result = await getCatalogItems();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Catalog" />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load catalog. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  return <CatalogManagementContent initialItems={result.data} />;
}
