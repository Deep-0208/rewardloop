"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { OTPInput } from "@/features/auth/components/otp-input";
import { AlertCircle } from "@/components/icons";

interface RewardOtpDrawerProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly customerPhone: string;
  readonly otpError: string | null;
  readonly isOtpPending: boolean;
  readonly resendSeconds: number;
  readonly otpResetKey: number;
  readonly onVerify: (token: string) => void;
  readonly onResend: () => void;
}

export function RewardOtpDrawer({
  isOpen,
  onOpenChange,
  customerPhone,
  otpError,
  isOtpPending,
  resendSeconds,
  otpResetKey,
  onVerify,
  onResend,
}: RewardOtpDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="p-6">
        <DrawerHeader className="px-0 pt-0 text-left">
          <DrawerTitle className="text-xl font-bold">
            Customer OTP Verification
          </DrawerTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit OTP sent to {customerPhone} to authorize reward redemption.
          </p>
        </DrawerHeader>

        {otpError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>{otpError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-6 py-4">
          <OTPInput
            key={otpResetKey}
            disabled={isOtpPending}
            onComplete={onVerify}
          />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {resendSeconds > 0 ? (
              <span>Resend OTP in {resendSeconds}s</span>
            ) : (
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                disabled={isOtpPending}
                onClick={onResend}
              >
                Resend OTP
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
