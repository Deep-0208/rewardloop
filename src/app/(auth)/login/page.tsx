import { Suspense } from "react";
import LoginForm from "./login-form";

type PageProps = {
  searchParams: Promise<{ phone?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={null}>
      <LoginForm initialPhone={params?.phone || ""} />
    </Suspense>
  );
}
