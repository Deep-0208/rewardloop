import * as React from "react";
import { Button } from "@/components/ui/button";

export interface ResendTimerProps {
  initialSeconds?: number;
  onResend: () => Promise<void>;
  isResending?: boolean;
}

export function ResendTimer({
  initialSeconds = 30,
  onResend,
  isResending,
}: ResendTimerProps) {
  const [countdown, setCountdown] = React.useState(initialSeconds);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    await onResend();
    setCountdown(initialSeconds); // restart timer on success
  };

  return (
    <div className="text-center text-sm" aria-live="polite">
      <span className="text-muted-foreground mr-1">
        Didn&apos;t receive the code?
      </span>
      {countdown > 0 ? (
        <span className="font-medium text-muted-foreground">
          Resend in {countdown}s
        </span>
      ) : (
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-medium"
          onClick={handleResend}
          disabled={isResending}
        >
          Resend OTP
        </Button>
      )}
    </div>
  );
}
