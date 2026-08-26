export const invalidMobileMessage =
  "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9";

export function nationalNumber(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export function isValidMobile(raw: string) {
  return /^[6-9]\d{9}$/.test(nationalNumber(raw));
}

export function mobileFieldError(raw: string, submitted = false) {
  const digits = nationalNumber(raw);
  if (!digits) return submitted ? invalidMobileMessage : "";
  if (!/^[6-9]/.test(digits)) return invalidMobileMessage;
  if (digits.length < 10) return submitted ? invalidMobileMessage : "";
  return isValidMobile(digits) ? "" : invalidMobileMessage;
}
