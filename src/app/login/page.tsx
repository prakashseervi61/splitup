'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'otp' | 'name';

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LoginPageInner() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState<boolean | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const maskedPhone = phone ? `+91 XXXXXX${phone.slice(-4)}` : '';

  // ─── Step 1: Send OTP ───
  const handleSendOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (phone.length !== 10) return;
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}` }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to send OTP');
        }

        setExists(data.exists);
        setOtp(['', '', '', '', '', '']);
        setResendCooldown(30);
        setStep('otp');
        // Focus first OTP input after transition
        setTimeout(() => otpRefs.current[0]?.focus(), 350);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [phone],
  );

  // ─── Step 2: Verify OTP ───
  const handleVerifyOtp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (otp.some((d) => !d)) return;
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}`, otp: otp.join('') }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Invalid OTP');
        }

        if (data.isNew) {
          setStep('name');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [otp, phone, router],
  );

  // ─── Step 3: Create profile ───
  const handleCreateProfile = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (trimmed.length < 2) return;
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}`, name: trimmed }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to create profile');
        }

        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [name, phone, router],
  );

  // ─── Resend OTP ───
  const handleResend = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to resend OTP');
      }

      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // ─── OTP input handlers ───
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) return;
      if (value && !/^\d$/.test(value)) return;

      const next = [...otp];
      next[index] = value;
      setOtp(next);

      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  // Handle paste for OTP
  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (!pasted) return;

      const next = [...otp];
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] || '';
      }
      setOtp(next);

      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    },
    [otp],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-10 mt-8 text-center animate-fade-up">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-heading">
            Splitup
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in to manage your shared expenses
          </p>
        </div>

        {/* Card */}
        <div
          className="animate-fade-up rounded-2xl border border-border bg-surface p-6 shadow-sm"
          style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ─── Step 1: Phone ─── */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              maxHeight: step === 'phone' ? '300px' : '0px',
              opacity: step === 'phone' ? 1 : 0,
              overflow: 'hidden',
              pointerEvents: step === 'phone' ? 'auto' : 'none',
            }}
          >
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-body">
                  Phone Number
                </label>
                <div className="mt-1 flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-surface-secondary px-3 text-sm text-text-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="block w-full rounded-r-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                    disabled={loading}
                    autoFocus
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          </div>

          {/* ─── Step 2: OTP ─── */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              maxHeight: step === 'otp' ? '400px' : '0px',
              opacity: step === 'otp' ? 1 : 0,
              overflow: 'hidden',
              pointerEvents: step === 'otp' ? 'auto' : 'none',
              marginTop: step === 'otp' ? '0' : undefined,
            }}
          >
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-body">
                  Enter the 6-digit code
                </label>
                <p className="mt-1 text-xs text-text-muted">
                  Sent to {maskedPhone}
                </p>
                <div className="mt-3 grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="h-12 w-full rounded-lg border border-border text-center text-lg font-semibold focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                      disabled={loading}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-text-muted">
                    Resend code in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs font-medium text-primary transition-colors hover:text-primary-dark disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                  className="flex h-11 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary"
                  disabled={loading}
                >
                  <ArrowLeft />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.some((d) => !d)}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Verifying...
                    </>
                  ) : exists ? (
                    'Verify & Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ─── Step 3: Name ─── */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              maxHeight: step === 'name' ? '400px' : '0px',
              opacity: step === 'name' ? 1 : 0,
              overflow: 'hidden',
              pointerEvents: step === 'name' ? 'auto' : 'none',
              marginTop: step === 'name' ? '0' : undefined,
            }}
          >
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-text-heading">
                  Welcome! What should we call you?
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  {maskedPhone}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-body">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                  disabled={loading}
                  autoFocus
                  minLength={2}
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  This is how your groupmates will see you
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || name.trim().length < 2}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Setting up...
                  </>
                ) : (
                  'Finish Setup'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
