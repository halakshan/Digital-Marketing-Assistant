"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface HireRequest {
  id: string;
  freelancerUid:      string;
  freelancerName:     string;
  projectDescription: string;
  budget:             string;
  status:             string;
  paid?:              boolean;
}
interface PaymentInfo {
  clientSecret:  string;
  paymentId:     string;
  amount:        number;
  platformFee:   number;
  freelancerNet: number;
  currency:      string;
  demo:          boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Demo checkout — shown when Stripe is not configured / no real key
───────────────────────────────────────────────────────────────────────────── */
function DemoCheckoutForm({
  payInfo, hire, onSuccess, onClose, token,
}: {
  payInfo:   PaymentInfo;
  hire:      HireRequest;
  onSuccess: () => void;
  onClose:   () => void;
  token:     string;
}) {
  const [paying,  setPaying]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [errMsg,  setErrMsg]  = useState("");

  const handleDemoPay = async () => {
    setPaying(true);
    setErrMsg("");
    try {
      const t   = token || (await getIdToken(auth.currentUser!));
      const res = await fetch(`${API}/payments/demo-confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body:    JSON.stringify({ paymentId: payInfo.paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Demo payment failed");
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2800);
    } catch (err: any) {
      setErrMsg(err.message || "Something went wrong");
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="p-10 text-center">
        <div className="w-20 h-20 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-bounce">✅</div>
        <p className="text-white font-extrabold text-xl">Payment Successful!</p>
        <p className="text-gray-400 text-sm mt-2">
          <span className="text-green-400 font-bold">LKR {payInfo.freelancerNet.toLocaleString()}</span> is held in escrow for{" "}
          <span className="text-white font-semibold">{hire.freelancerName}</span>.
        </p>
        <p className="text-xs text-gray-500 mt-3">
          It will be released to the freelancer after you approve the work.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Demo mode banner */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
        <span className="text-lg flex-shrink-0">🧪</span>
        <div>
          <p className="text-xs text-amber-300 font-semibold leading-relaxed">Demo / Test Mode</p>
          <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">
            No real charge will be made. Click "Confirm" to simulate a successful payment and test the escrow flow.
          </p>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Service amount</span>
          <span className="text-sm font-bold text-white">LKR {payInfo.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Platform fee (10%)</span>
          <span className="text-sm text-gray-300">LKR {payInfo.platformFee.toLocaleString()}</span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-white">Total charged</span>
          <span className="text-base font-extrabold text-violet-400">LKR {payInfo.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Freelancer receives</span>
          <span className="text-xs text-green-400 font-semibold">LKR {payInfo.freelancerNet.toLocaleString()}</span>
        </div>
      </div>

      {/* Escrow notice */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <span className="text-lg flex-shrink-0">🔒</span>
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Escrow protected.</strong> Your payment is held securely. It's only released to the freelancer
          after you approve the completed work.
        </p>
      </div>

      {/* Simulated card UI */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Card Details (Demo)</p>
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <span className="text-gray-600 text-sm">4242</span>
          <span className="text-gray-700 mx-1">·</span>
          <span className="text-gray-600 text-sm">4242</span>
          <span className="text-gray-700 mx-1">·</span>
          <span className="text-gray-600 text-sm">4242</span>
          <span className="text-gray-700 mx-1">·</span>
          <span className="text-gray-600 text-sm">4242</span>
          <span className="ml-auto text-gray-600 text-xs">12/99  &nbsp;  CVV 123</span>
        </div>
        <p className="text-[10px] text-gray-600">Stripe test card — no real charges</p>
      </div>

      {errMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ {errMsg}
        </div>
      )}

      <button
        onClick={handleDemoPay}
        disabled={paying}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 py-3.5 rounded-2xl font-bold text-sm transition-all text-white shadow-lg flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            Processing…
          </>
        ) : (
          <>🔒 Confirm Demo Payment — LKR {payInfo.amount.toLocaleString()}</>
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Demo mode · No real charge · Add your Stripe key to enable live payments
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Real Stripe checkout — used when a valid Stripe key is configured
───────────────────────────────────────────────────────────────────────────── */
function CheckoutForm({
  payInfo, hire, onSuccess, onClose,
}: {
  payInfo:   PaymentInfo;
  hire:      HireRequest;
  onSuccess: () => void;
  onClose:   () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,  setPaying]  = useState(false);
  const [errMsg,  setErrMsg]  = useState("");
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErrMsg("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/marketplace?payment_success=1`,
      },
    });

    if (error) {
      setErrMsg(error.message || "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2500);
    } else {
      setErrMsg("Payment processing — please check your notifications for confirmation.");
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="p-10 text-center">
        <div className="w-20 h-20 bg-green-500/15 border-2 border-green-500/40 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-bounce">✅</div>
        <p className="text-white font-extrabold text-xl">Payment Successful!</p>
        <p className="text-gray-400 text-sm mt-2">
          <span className="text-green-400 font-bold">LKR {payInfo.freelancerNet.toLocaleString()}</span> is held in escrow for{" "}
          <span className="text-white font-semibold">{hire.freelancerName}</span>.
        </p>
        <p className="text-xs text-gray-500 mt-3">
          It will be released to the freelancer after you approve the work.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Payment summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Service amount</span>
          <span className="text-sm font-bold text-white">LKR {payInfo.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Platform fee (10%)</span>
          <span className="text-sm text-gray-300">LKR {payInfo.platformFee.toLocaleString()}</span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-white">Total charged</span>
          <span className="text-base font-extrabold text-violet-400">LKR {payInfo.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Freelancer receives</span>
          <span className="text-xs text-green-400 font-semibold">LKR {payInfo.freelancerNet.toLocaleString()}</span>
        </div>
      </div>

      {/* Escrow notice */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <span className="text-lg flex-shrink-0">🔒</span>
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Escrow protected.</strong> Your payment is held securely. It's only released to the freelancer
          after you approve the completed work.
        </p>
      </div>

      {/* Stripe PaymentElement */}
      <div>
        <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Card Details</p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <PaymentElement
            options={{
              layout: "tabs",
              defaultValues: { billingDetails: {} },
            }}
          />
        </div>
      </div>

      {errMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ {errMsg}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying || !stripe || !elements}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 py-3.5 rounded-2xl font-bold text-sm transition-all text-white shadow-lg flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            Processing…
          </>
        ) : (
          <>🔒 Pay LKR {payInfo.amount.toLocaleString()} Securely</>
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Powered by <span className="text-gray-400 font-semibold">Stripe</span> · SSL encrypted · PCI DSS compliant
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main exported modal
───────────────────────────────────────────────────────────────────────────── */
export default function StripePaymentModal({
  hire, onClose, onSuccess, token,
}: {
  hire:      HireRequest;
  onClose:   () => void;
  onSuccess: () => void;
  token:     string;
}) {
  const [payInfo,  setPayInfo]  = useState<PaymentInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [initErr,  setInitErr]  = useState("");

  /* ── Create Payment Intent on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const t   = token || (await getIdToken(auth.currentUser!));
        const res = await fetch(`${API}/payments/create-intent`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
          body:    JSON.stringify({ hireRequestId: hire.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to initialize payment");
        setPayInfo(data);
      } catch (err: any) {
        setInitErr(err.message || "Could not start payment");
      } finally {
        setLoading(false);
      }
    })();
  }, [hire.id, token]);

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary:    "#7c3aed",
      colorBackground: "#0d0d1a",
      colorText:       "#ffffff",
      colorDanger:     "#ef4444",
      borderRadius:    "12px",
    },
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/30 to-indigo-600/20 border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">💰 Secure Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              To: <span className="text-violet-400 font-semibold">{hire.freelancerName}</span>
              {" · "}<span className="text-gray-300">{hire.budget}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all">✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-10 text-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-gray-400 text-sm">Initializing secure payment…</p>
          </div>
        )}

        {/* Error */}
        {!loading && initErr && (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-400 font-semibold mb-1">⚠️ Payment Error</p>
              <p className="text-sm text-gray-400">{initErr}</p>
            </div>
            <button onClick={onClose} className="mt-4 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-semibold text-sm transition-all text-gray-300">
              Close
            </button>
          </div>
        )}

        {/* Demo mode checkout */}
        {!loading && payInfo?.demo && (
          <DemoCheckoutForm
            payInfo={payInfo}
            hire={hire}
            onSuccess={onSuccess}
            onClose={onClose}
            token={token}
          />
        )}

        {/* Real Stripe Elements checkout */}
        {!loading && payInfo && !payInfo.demo && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: payInfo.clientSecret, appearance }}
          >
            <CheckoutForm
              payInfo={payInfo}
              hire={hire}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
