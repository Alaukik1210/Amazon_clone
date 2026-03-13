"use client";

import { useEffect, useRef, useState } from "react";

interface OtpTimerProps {
  onResend: () => Promise<void>;
  initialSeconds?: number;
}

/**
 * Shows a cooldown timer after OTP is sent.
 * When countdown reaches 0, shows "Resend OTP" link.
 */
export function OtpTimer({ onResend, initialSeconds = 60 }: OtpTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [resending, setResending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleResend = async () => {
    if (resending || seconds > 0) return;
    setResending(true);
    try {
      await onResend();
      setSeconds(initialSeconds);
      // Restart countdown
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { clearInterval(intervalRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    } finally {
      setResending(false);
    }
  };

  if (seconds > 0) {
    return (
      <p className="text-sm text-center text-[var(--amazon-text-muted)]">
        Resend OTP in <span className="font-semibold text-[var(--amazon-text-primary)]">{seconds}s</span>
      </p>
    );
  }

  return (
    <p className="text-sm text-center">
      Didn&apos;t receive it?{" "}
      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="amazon-link font-medium disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend OTP"}
      </button>
    </p>
  );
}
