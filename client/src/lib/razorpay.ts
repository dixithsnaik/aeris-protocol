export type RazorpayCharge = {
  amountPaise: number;
  name: string;
  email?: string;
  description: string;
  orderId?: string;
  key?: string;
};

export type RazorpayResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
};

type RazorpayCtor = new (opts: Record<string, unknown>) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export function chargeRazorpay(input: RazorpayCharge): Promise<RazorpayResult> {
  const key = String(input.key ?? "").trim();
  if (key) return chargeLive(key, input);
  return chargeMock(input);
}

function paid(prefix: string): RazorpayResult {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  return {
    razorpay_payment_id: `${prefix}_${id}`,
    razorpay_order_id: `order_${id}`,
    razorpay_signature: prefix === "pay_mock" ? "mock" : "live",
  };
}

function tabCss(on: boolean) {
  const fill = on
    ? "background:var(--color-brand);color:var(--color-brand-fg);border-color:var(--color-brand)"
    : "background:var(--color-surface);color:var(--color-fg);border-color:var(--color-line)";
  return `flex:1;min-width:0;border:1px solid;${fill};padding:.45rem .2rem;font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer`;
}

function chargeMock(input: RazorpayCharge): Promise<RazorpayResult> {
  // ponytail: mock overlay when server has no Razorpay keys; live Checkout only with a server-created order_id
  return new Promise((resolve, reject) => {
    const rupees = (input.amountPaise / 100).toFixed(2);
    const upi = `upi://pay?pa=success@razorpay&pn=AERIS&am=${rupees}&cu=INR&tn=${encodeURIComponent(input.description)}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upi)}`;
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const field =
      "width:100%;box-sizing:border-box;margin-top:.5rem;border:1px solid var(--color-line);background:var(--color-surface);color:var(--color-fg);padding:.65rem;font-family:var(--font-mono);font-size:12px";
    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-label", "Razorpay Checkout");
    dialog.style.cssText =
      "border:0;padding:0;max-width:26rem;width:calc(100% - 2rem);max-height:90vh;overflow:auto;background:var(--color-surface);color:var(--color-fg);";
    dialog.innerHTML = `
      <form method="dialog" style="padding:1.25rem 1.5rem 1.5rem">
        <p style="margin:0;font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--color-muted)">Razorpay</p>
        <p style="margin:.35rem 0 0;font-family:var(--font-serif);font-size:1.5rem">AERIS</p>
        <p style="margin:.25rem 0 0;font-family:var(--font-mono);font-size:.8rem;color:var(--color-muted)">${input.description}</p>
        <p style="margin:1rem 0 0;font-family:var(--font-serif);font-size:1.75rem">₹${Number(rupees).toLocaleString("en-IN")}</p>
        <div data-tabs style="display:flex;gap:.35rem;margin:1rem 0">
          <button type="button" data-tab="upi" style="${tabCss(true)}">UPI</button>
          <button type="button" data-tab="card" style="${tabCss(false)}">Card</button>
          <button type="button" data-tab="netbanking" style="${tabCss(false)}">Netbanking</button>
          <button type="button" data-tab="wallet" style="${tabCss(false)}">Wallet</button>
        </div>
        <div data-pane="upi">
          ${
            mobile
              ? `<p style="margin:0 0 .75rem;font-family:var(--font-mono);font-size:12px;color:var(--color-muted)">Opens GPay, PhonePe, Paytm, or any UPI app.</p>
                 <a data-upi href="${upi}" style="display:block;text-align:center;background:var(--color-brand);color:var(--color-brand-fg);padding:.85rem;font-family:var(--font-mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none">Pay with UPI app</a>`
              : `<p style="margin:0 0 .75rem;font-family:var(--font-mono);font-size:12px;color:var(--color-muted)">Scan QR with any UPI app</p>
                 <img alt="UPI QR" width="220" height="220" src="${qr}" style="display:block;margin:0 auto;background:var(--color-surface)" />`
          }
        </div>
        <div data-pane="card" hidden>
          <input name="card" inputmode="numeric" autocomplete="cc-number" placeholder="Card number" style="${field}">
          <div style="display:flex;gap:.5rem;min-width:0">
            <input name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" style="${field}">
            <input name="cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="CVV" style="${field}">
          </div>
        </div>
        <div data-pane="netbanking" hidden>
          <select name="bank" style="${field}">
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>SBI</option>
            <option>Axis Bank</option>
          </select>
        </div>
        <div data-pane="wallet" hidden>
          <select name="wallet" style="${field}">
            <option>Paytm</option>
            <option>PhonePe</option>
            <option>Amazon Pay</option>
            <option>Mobikwik</option>
          </select>
        </div>
        <button type="submit" value="pay" style="margin-top:1rem;width:100%;border:0;background:var(--color-brand);color:var(--color-brand-fg);padding:.85rem;font-family:var(--font-mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer">Complete payment</button>
        <button type="submit" value="cancel" style="margin-top:.5rem;width:100%;border:1px solid var(--color-line);background:var(--color-surface);color:var(--color-fg);padding:.75rem;font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer">Cancel</button>
      </form>
    `;
    const tabs = dialog.querySelectorAll<HTMLButtonElement>("[data-tab]");
    const panes = dialog.querySelectorAll<HTMLElement>("[data-pane]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.dataset.tab;
        tabs.forEach((row) => {
          row.setAttribute("style", tabCss(row.dataset.tab === id));
        });
        panes.forEach((pane) => {
          pane.hidden = pane.dataset.pane !== id;
        });
      });
    });
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      dialog.remove();
      if (ok) resolve(paid("pay_mock"));
      else reject(new Error("cancelled"));
    };
    dialog.addEventListener("close", () => finish(dialog.returnValue === "pay"));
    dialog.querySelector("[data-upi]")?.addEventListener("click", () => {
      window.setTimeout(() => {
        if (dialog.isConnected) {
          dialog.returnValue = "pay";
          dialog.close("pay");
        }
      }, 1600);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}

async function chargeLive(key: string, input: RazorpayCharge): Promise<RazorpayResult> {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Razorpay checkout failed to load");
  const brand = getComputedStyle(document.documentElement).getPropertyValue("--color-brand").trim() || "#1d3331";
  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key,
      amount: input.amountPaise,
      currency: "INR",
      name: "AERIS",
      description: input.description,
      ...(input.orderId ? { order_id: input.orderId } : {}),
      prefill: { name: input.name, email: input.email ?? "", method: "upi" },
      method: { upi: true, card: true, netbanking: true, wallet: true },
      theme: { color: brand },
      handler: (res: RazorpayResult) => resolve(res),
      modal: { ondismiss: () => reject(new Error("cancelled")) },
    });
    checkout.open();
  });
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout failed to load"));
    document.head.append(script);
  });
}
