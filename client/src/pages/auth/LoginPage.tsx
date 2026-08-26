import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../../components/sections/AuthCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/patterns/Field";
import { ui } from "../../config/ui";
import { requestOtp, verifyOtp } from "../../lib/api";
import { invalidMobileMessage, isValidMobile, mobileFieldError, nationalNumber } from "../../lib/phone";
import { setToken } from "../../lib/session";
import { safeNext } from "../../lib/next";
import { OtpStep } from "./OtpStep";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const next = safeNext((location.state as { from?: string } | null)?.from);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = isValidMobile(phone);
  const phoneError = error || mobileFieldError(phone, touched);

  async function sendCode() {
    const { ok, data } = await requestOtp(nationalNumber(phone));
    if (!ok) {
      setError(data.error ?? "Could not send OTP");
      return false;
    }
    setError("");
    return true;
  }

  async function onPhoneSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!valid || busy) {
      setError(invalidMobileMessage);
      return;
    }
    setBusy(true);
    const ok = await sendCode();
    setBusy(false);
    if (ok) setStep("otp");
  }

  async function onVerify(otp: string) {
    setBusy(true);
    const { ok, data } = await verifyOtp(nationalNumber(phone), otp);
    setBusy(false);
    if (!ok || !data.token) {
      setError(data.error === "invalid otp" ? "Invalid OTP" : (data.error ?? "Invalid OTP"));
      return;
    }
    setToken(data.token);
    navigate(next, { replace: true });
  }

  return (
    <AuthCard brand={ui.brand} tagline={ui.tagline} kyc={ui.kyc}>
      {step === "phone" ? (
        <form className="flex w-full flex-col gap-6" onSubmit={onPhoneSubmit}>
          <Field
            id="mobile"
            label="Mobile number"
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9876543210"
            value={phone}
            error={phoneError}
            onBlur={() => setTouched(true)}
            onChange={(event) => {
              setPhone(nationalNumber(event.target.value));
              setError("");
            }}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait" : "Continue"}
          </Button>
        </form>
      ) : (
        <OtpStep
          phone={phone}
          error={error}
          busy={busy}
          onVerify={onVerify}
          onResend={sendCode}
          onClearError={() => setError("")}
          onEditNumber={() => {
            setStep("phone");
            setError("");
            setTouched(true);
          }}
        />
      )}
    </AuthCard>
  );
}
