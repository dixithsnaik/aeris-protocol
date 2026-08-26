import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { VerifyPaywall } from "../../components/sections/VerifyPaywall";
import { paths, propertyPath } from "../../config/routes";
import { ui } from "../../config/ui";
import {
  completeVerify,
  fetchMe,
  fetchVerifyCatalog,
  startVerifyCheckout,
  type VerifyCatalog,
  type VerifyPackageId,
} from "../../lib/api";
import { chargeRazorpay } from "../../lib/razorpay";

export function VerifyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pid = Number(id);
  const [catalog, setCatalog] = useState<VerifyCatalog | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [selected, setSelected] = useState<VerifyPackageId>("verified");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(pid) || pid < 1) {
      setBlocked(true);
      return;
    }
    void Promise.all([fetchVerifyCatalog(pid), fetchMe()]).then(([row, me]) => {
      if (!row.ok || !row.data.packages?.length) {
        setBlocked(true);
        return;
      }
      setCatalog(row.data);
      const fallback = row.data.packages.find((pack) => pack.id === row.data.default) ?? row.data.packages[0];
      setSelected(fallback.id);
      if (me?.name) setName(me.name);
      if (me?.email) setEmail(me.email);
    });
  }, [pid]);

  if (blocked) {
    return <Navigate to={Number.isInteger(pid) && pid > 0 ? propertyPath(pid) : paths.home} replace />;
  }
  if (!catalog) {
    return <p className="px-4 py-16 font-mono text-sm text-muted sm:px-8">{ui.property.loading}</p>;
  }

  const pack = catalog.packages.find((row) => row.id === selected) ?? catalog.packages[0];
  if (!pack) {
    return <Navigate to={propertyPath(pid)} replace />;
  }

  async function onPay() {
    setBusy(true);
    setError("");
    try {
      const checkout = await startVerifyCheckout(pid, pack.id);
      if (!checkout.ok || !checkout.data.checkout_id || !checkout.data.amount_paise) {
        setError(checkout.data.error ?? "Checkout could not start.");
        setBusy(false);
        return;
      }
      const paid = await chargeRazorpay({
        amountPaise: checkout.data.amount_paise,
        orderId: checkout.data.order_id,
        key: checkout.data.key_id,
        name,
        email,
        description: `${ui.verify.packs[pack.id].name} · AERIS verify`,
      });
      const { ok, data } = await completeVerify(pid, {
        package_id: pack.id,
        checkout_id: checkout.data.checkout_id,
        razorpay_payment_id: paid.razorpay_payment_id,
        razorpay_order_id: paid.razorpay_order_id || checkout.data.order_id,
        razorpay_signature: paid.razorpay_signature,
      });
      if (!ok || !data.id) {
        setError(data.error ?? "Payment captured, verification did not stamp.");
        setBusy(false);
        return;
      }
      navigate(propertyPath(pid), { replace: true });
    } catch (err) {
      setBusy(false);
      if (err instanceof Error && err.message === "cancelled") return;
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  }

  return (
    <VerifyPaywall
      packages={catalog.packages}
      feeRate={catalog.fee_rate}
      selected={pack.id}
      busy={busy}
      error={error}
      onSelect={setSelected}
      onPay={() => void onPay()}
      onCancel={() => navigate(propertyPath(pid))}
    />
  );
}
