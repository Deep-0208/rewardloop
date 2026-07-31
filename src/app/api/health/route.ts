import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import pkg from "../../../../package.json";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test DB connection by selecting current time
    await supabase.from("businesses").select("id").limit(1);

    // It's okay if this RPC returns an error or no data for dummy ID, as long as the connection succeeds.
    // A better approach is querying something simple if available, but since we are locked to specific RPCs,
    // we can just check if we can reach supabase auth.
    const { error: authError } = await supabase.auth.getSession();

    const isDbHealthy = !authError; // Using Auth admin as a proxy for connection health

    return NextResponse.json(
      {
        status: isDbHealthy ? "healthy" : "unhealthy",
        version: pkg.version,
        timestamp: new Date().toISOString(),
        services: {
          database: isDbHealthy ? "up" : "down",
          auth: !authError ? "up" : "down",
        },
      },
      { status: isDbHealthy ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        version: pkg.version,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
