/* eslint-disable no-console */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface SmsPayload {
  customerId: string;
  transactionId: string;
  finalPaidPaise: number;
  rewardEarnedPaise: number;
  rewardUsedPaise: number;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: SmsPayload = await req.json();
    const {
      customerId,
      transactionId,
      finalPaidPaise,
      rewardEarnedPaise,
      rewardUsedPaise,
    } = payload;

    if (!customerId || !transactionId) {
      return new Response(
        JSON.stringify({ error: "Missing required transaction fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("phone, name")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      console.error(
        "[send-transaction-sms] Customer not found:",
        customerError,
      );
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const finalAmountInr = (finalPaidPaise / 100).toFixed(2);
    const earnedInr = (rewardEarnedPaise / 100).toFixed(2);
    const usedInr = (rewardUsedPaise / 100).toFixed(2);

    const message = `Thank you for your visit! Paid: ₹${finalAmountInr}. Rewards Earned: ₹${earnedInr}. Rewards Used: ₹${usedInr}.`;

    // Simulated SMS Send via MSG91
    console.log(
      `[send-transaction-sms] SMS sent to ${customer.phone}: "${message}"`,
    );

    return new Response(
      JSON.stringify({ success: true, messageId: `msg_${Date.now()}` }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-transaction-sms] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
