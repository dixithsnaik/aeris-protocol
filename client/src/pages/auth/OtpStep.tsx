import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/patterns/Field";
import { session } from "../../config/auth";

type Props = {
  phone: string;
  error: string;
  busy: boolean;
  onVerify: (otp: string) => void;
  onResend: () => Promise<boolean>;
  onEditNumber: () => void;
  onClearError: () => void;
};

export function OtpStep({ phone, error, busy, onVerify, onResend, onEditNumber, onClearError }: Props) {
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState<number>(session.resendSeconds);
  const [resending, setResending] = useState(false);
  const [hint, setHint] = useState("");
  const ready = otp.length === 6;

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) {
      setHint("Enter the 6-digit OTP");
      return;
    }
    if (!busy) onVerify(otp);
  }

  async function resend() {
    if (left > 0 || resending || busy) return;
    setResending(true);
    const ok = await onResend();
    setResending(false);
    if (ok) {
      setOtp("");
      setLeft(session.resendSeconds);
    }
  }

  const resendLabel =
    left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : resending ? "Sending" : "Resend OTP";

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={submit}>
      <div className="flex w-full items-center justify-between gap-3">
        <p className="font-mono text-sm text-fg">+91 {phone}</p>
        <button
          type="button"
          className="shrink-0 font-mono text-xs font-medium uppercase tracking-[0.12em] text-brand underline underline-offset-4 disabled:opacity-40"
          disabled={busy}
          onClick={onEditNumber}
        >
          Edit number
        </button>
      </div>
      <Field
        id="otp"
        label="One time password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={otp}
        error={error || hint}
        onChange={(event) => {
          setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
          setHint("");
          onClearError();
        }}
        className="tracking-[0.35em]"
      />
      <div className="flex w-full flex-col gap-3">
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait" : "Continue"}
        </Button>
        <button
          type="button"
          className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-brand underline underline-offset-4 disabled:text-muted disabled:no-underline disabled:opacity-70"
          disabled={left > 0 || resending || busy}
          onClick={resend}
        >
          {resendLabel}
        </button>
      </div>
    </form>
  );
}
