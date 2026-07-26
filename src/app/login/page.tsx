"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SplitArrowIcon from "@/components/ui/icons/SplitArrowIcon";
import GroupPeopleIcon from "@/components/ui/icons/GroupPeopleIcon";
import RupeeCircleIcon from "@/components/ui/icons/RupeeCircleIcon";
import SettleCheckIcon from "@/components/ui/icons/SettleCheckIcon";

type Step = "phone" | "otp" | "name";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function FloatingIllustration() {
  return (
    <svg viewBox="0 0 400 320" fill="none" className="w-full max-w-[340px] h-auto anim-float" aria-hidden="true">
      <rect x="80" y="200" width="240" height="12" rx="6" fill="#E8F3EE" stroke="#1A6B4C" strokeWidth="1.5" />
      <rect x="110" y="212" width="8" height="50" rx="2" fill="#E8F3EE" stroke="#1A6B4C" strokeWidth="1.2" />
      <rect x="282" y="212" width="8" height="50" rx="2" fill="#E8F3EE" stroke="#1A6B4C" strokeWidth="1.2" />
      <circle cx="150" cy="130" r="22" fill="#E8F3EE" stroke="#1A6B4C" strokeWidth="2" />
      <path d="M120 185c0-16 13-30 30-30s30 14 30 30" fill="#E8F3EE" stroke="#1A6B4C" strokeWidth="2" />
      <circle cx="144" cy="128" r="2" fill="#1A6B4C" />
      <circle cx="156" cy="128" r="2" fill="#1A6B4C" />
      <path d="M145 136c2 3 6 3 8 0" stroke="#1A6B4C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="250" cy="135" r="20" fill="#E8F3EE" stroke="#14563B" strokeWidth="2" />
      <path d="M222 188c0-15 12-28 28-28s28 13 28 28" fill="#E8F3EE" stroke="#14563B" strokeWidth="2" />
      <circle cx="244" cy="133" r="2" fill="#14563B" />
      <circle cx="256" cy="133" r="2" fill="#14563B" />
      <path d="M245 140c2 3 6 3 8 0" stroke="#14563B" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="175" y="165" width="50" height="35" rx="4" fill="white" stroke="#1A6B4C" strokeWidth="1.5" />
      <line x1="183" y1="175" x2="217" y2="175" stroke="#1A6B4C" strokeWidth="1" opacity="0.5" />
      <line x1="183" y1="182" x2="210" y2="182" stroke="#1A6B4C" strokeWidth="1" opacity="0.5" />
      <line x1="183" y1="189" x2="213" y2="189" stroke="#1A6B4C" strokeWidth="1" opacity="0.5" />
      <text x="200" y="200" textAnchor="middle" fill="#1A6B4C" fontSize="7" fontWeight="bold">{"\u20B9"} 50/3</text>
      <circle cx="310" cy="120" r="18" fill="#1A6B4C" opacity="0.1" />
      <text x="310" y="124" textAnchor="middle" fill="#1A6B4C" fontSize="11" fontWeight="bold">UPI</text>
      <circle cx="90" cy="190" r="10" fill="#1A6B4C" opacity="0.15" />
      <text x="90" y="193" textAnchor="middle" fill="#1A6B4C" fontSize="8" fontWeight="bold">{"\u20B9"}</text>
      <circle cx="320" cy="195" r="8" fill="#14563B" opacity="0.12" />
      <text x="320" y="198" textAnchor="middle" fill="#14563B" fontSize="7" fontWeight="bold">{"\u20B9"}</text>
    </svg>
  );
}

function FeatureStrip({ className = "" }: { className?: string }) {
  const features = [
    { icon: <GroupPeopleIcon size={20} color="#1A6B4C" />, label: "Split with roommates" },
    { icon: <RupeeCircleIcon size={20} color="#1A6B4C" />, label: "Track expenses" },
    { icon: <SettleCheckIcon size={20} color="#1A6B4C" />, label: "Settle via UPI" },
  ];
  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {features.map((f) => (
        <div key={f.label} className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {f.icon}
          </div>
          <span className="text-xs text-text-muted text-center leading-tight max-w-[80px]">{f.label}</span>
        </div>
      ))}
    </div>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const maskedPhone = phone ? `+91 XXXXXX${phone.slice(-4)}` : "";

  const handleSendOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (phone.length !== 10) return;
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: `+91${phone}` }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to send OTP");
        setExists(data.exists);
        setOtp(["", "", "", "", "", ""]);
        setResendCooldown(30);
        setStep("otp");
        setTimeout(() => otpRefs.current[0]?.focus(), 350);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [phone],
  );

  const handleVerifyOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (otp.some((d) => !d)) return;
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: `+91${phone}`, otp: otp.join("") }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Invalid OTP");
        if (data.isNew) {
          setStep("name");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [otp, phone, router],
  );

  const handleCreateProfile = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (trimmed.length < 2) return;
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: `+91${phone}`, name: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to create profile");
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [name, phone, router],
  );

  const handleResend = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to resend OTP");
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) return;
      if (value && !/^\d$/.test(value)) return;
      const next = [...otp];
      next[index] = value;
      setOtp(next);
      if (value && index < 5) otpRefs.current[index + 1]?.focus();
    },
    [otp],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...otp];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
      setOtp(next);
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    },
    [otp],
  );

  const stepHeights: Record<Step, string> = {
    phone: "280px",
    otp: "340px",
    name: "280px",
  };

  return (
    <>
      <style jsx global>{`
        :root {
  --left-panel-display: none;
  --left-panel-w: 0%;
  --right-panel-w: 100%;
  --mobile-header-display: flex;
  --desktop-header-display: none;
  --mobile-features-display: flex;
}
@media (min-width: 1024px) {
  :root {
    --left-panel-display: flex;
    --left-panel-w: 55%;
    --right-panel-w: 45%;
    --mobile-header-display: none;
    --desktop-header-display: flex;
    --mobile-features-display: none;
  }
}
      `}</style>

      <div className="flex min-h-screen bg-background">
        {/* ── Left Panel (desktop only) ── */}
        <div className="relative flex-col items-center justify-center overflow-hidden" style={{ display: "var(--left-panel-display, none)", width: "var(--left-panel-w, 0%)", background: "linear-gradient(135deg, #E8F3EE, #F3F0EB, #E8F3EE)" }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[10%] left-[8%] h-48 w-48 rounded-full bg-primary/5" />
          <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-primary/5" />
          <div className="absolute top-[60%] left-[5%] h-32 w-32 rounded-full bg-primary/[0.03]" />

          <div className="relative z-10 flex flex-col items-center gap-8 px-12">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <SplitArrowIcon size={36} color="#1A6B4C" />
              <span className="font-display text-3xl font-bold text-heading" style={{ fontFamily: "Outfit" }}>Splitup</span>
            </div>

            {/* Illustration */}
            <FloatingIllustration />

            {/* Headline */}
            <h1 className="text-center font-display text-2xl font-bold text-heading leading-snug" style={{ fontFamily: "Outfit" }}>
              Split fairly. Settle instantly.
            </h1>

            {/* Feature strip */}
            <FeatureStrip className="mt-2" />
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:py-16" style={{ width: "var(--right-panel-w, 100%)" }}>
          {/* Mobile header */}
          <div className="mb-10 flex flex-col items-center gap-3" style={{ display: "var(--mobile-header-display, flex)" }}>
            <div className="flex items-center gap-2.5">
              <SplitArrowIcon size={28} color="#1A6B4C" />
              <span className="font-display text-2xl font-bold text-heading" style={{ fontFamily: "Outfit" }}>Splitup</span>
            </div>
            <p className="text-center text-sm text-text-muted">Split fairly. Settle instantly.</p>
          </div>

          {/* Desktop header */}
          <div className="mb-8 w-full max-w-sm" style={{ display: "var(--desktop-header-display, none)" }}>
            <h2 className="font-display text-2xl font-bold text-heading" style={{ fontFamily: "Outfit" }}>Get started</h2>
            <p className="mt-1.5 text-sm text-text-muted">Enter your phone number to continue</p>
          </div>

          {/* Form card */}
          <div className="w-full max-w-sm">
            {/* Error */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Step: Phone ── */}
            <div className={`overflow-hidden transition-all duration-300 ${step === "phone" ? "opacity-100" : "max-h-0 opacity-0"}`} style={{ maxHeight: step === "phone" ? stepHeights.phone : 0 }}>
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-heading">Phone number</label>
                  <div className="flex">
                    <div className="flex items-center justify-center rounded-l-xl border border-r-0 border-border bg-surface-secondary px-3.5 text-sm font-medium text-text-muted" style={{ height: "48px" }}>
                      +91
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(v);
                        setError("");
                      }}
                      placeholder="98765 43210"
                      className="flex-1 rounded-r-xl border border-border bg-white px-4 text-base text-heading outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                      style={{ height: "48px" }}
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={phone.length !== 10 || loading}
                  className="flex w-full items-center justify-center rounded-xl bg-primary font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ height: "48px" }}
                >
                  {loading ? <Spinner /> : "Continue"}
                </button>
              </form>
            </div>

            {/* ── Step: OTP ── */}
            <div className={`overflow-hidden transition-all duration-300 ${step === "otp" ? "opacity-100" : "max-h-0 opacity-0"}`} style={{ maxHeight: step === "otp" ? stepHeights.otp : 0 }}>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Enter the 6-digit code</label>
                  <p className="mb-4 text-sm text-text-muted">Sent to {maskedPhone}</p>
                  <div className="flex justify-between gap-2.5">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="rounded-xl border border-border bg-white text-center text-lg font-semibold text-heading outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        style={{ height: "48px", width: "46px" }}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setError(""); }}
                    className="text-sm font-medium text-text-muted hover:text-heading transition-colors"
                  >
                    {"\u2190"} Back
                  </button>
                  {resendCooldown > 0 ? (
                    <span className="text-sm text-text-muted">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otp.some((d) => !d) || loading}
                  className="flex w-full items-center justify-center rounded-xl bg-primary font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ height: "48px" }}
                >
                  {loading ? <Spinner /> : "Verify"}
                </button>
              </form>
            </div>

            {/* ── Step: Name ── */}
            <div className={`overflow-hidden transition-all duration-300 ${step === "name" ? "opacity-100" : "max-h-0 opacity-0"}`} style={{ maxHeight: step === "name" ? stepHeights.name : 0 }}>
              <form onSubmit={handleCreateProfile} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-heading">Your name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="What should we call you?"
                    className="w-full rounded-xl border border-border bg-white px-4 text-base text-heading outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    style={{ height: "48px" }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={name.trim().length < 2 || loading}
                  className="flex w-full items-center justify-center rounded-xl bg-primary font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ height: "48px" }}
                >
                  {loading ? <Spinner /> : "Finish Setup"}
                </button>
              </form>
            </div>

            {/* Trust line */}
            <div className="mt-10 flex items-center justify-center gap-1.5 text-text-muted">
              <LockIcon />
              <span className="text-xs">Your data is private and never sold</span>
            </div>
          </div>

          {/* Mobile feature strip */}
          <div className="mt-12" style={{ display: "var(--mobile-features-display, flex)" }}>
            <FeatureStrip />
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#F3F0EB" }}>
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
