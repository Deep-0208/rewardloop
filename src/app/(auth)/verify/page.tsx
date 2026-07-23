import { Suspense } from "react";
import { redirect } from "next/navigation";
import VerifyForm from "./verify-form";

type PageProps = {
  searchParams: Promise<{ phone?: string }>;
};

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params?.phone) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <VerifyForm phone={params.phone} />
    </Suspense>
  );
}
