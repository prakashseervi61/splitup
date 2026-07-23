"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface StepConfig {
  headline: string;
  description: string;
  target?: string;
}

const STEPS: StepConfig[] = [
  {
    headline: "Welcome to Splitup!",
    description:
      "Let's show you around — takes 30 seconds.",
  },
  {
    headline: "Your Groups",
    description:
      "Your groups live here — PG, hostel, or a trip. Create one and add your roommates.",
    target: "[data-walkthrough='groups']",
  },
  {
    headline: "Create a Group",
    description:
      "Start here — create a group for your flat or PG and invite your roommates via a WhatsApp link.",
    target: "[data-walkthrough='create-group']",
  },
  {
    headline: "Add an Expense",
    description:
      "Every time someone pays for the group, log it here. Splitup calculates who owes what automatically.",
    target: "[data-walkthrough='add-expense']",
  },
  {
    headline: "Balances",
    description:
      "This is your live balance — who owes you and how much, always up to date.",
    target: "[data-walkthrough='balances']",
  },
  {
    headline: "Settle Up",
    description:
      "Tap Settle Now and your UPI app opens pre-filled with the exact amount. One tap to clear the debt.",
    target: "[data-walkthrough='settle-now']",
  },
  {
    headline: "You're all set!",
    description:
      "Create your first group to get started.",
  },
];

interface WalkthroughProps {
  userId: string;
  userName?: string;
  onComplete: () => void;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function getViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isMobileViewport(width: number) {
  return width < 640;
}

export default function Walkthrough({ userId, userName, onComplete }: WalkthroughProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [cutout, setCutout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tooltipSide, setTooltipSide] = useState<"above" | "below" | "bottom-sheet">("below");
  const [isMobile, setIsMobile] = useState(false);
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const vp = getViewport();
      setIsMobile(isMobileViewport(vp.width));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const measureTarget = useCallback(
    (selector?: string) => {
      if (!selector) {
        setCutout(null);
        return;
      }
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setCutout(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const newCutout = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
      setCutout(newCutout);

      const vp = getViewport();
      if (isMobileViewport(vp.width)) {
        setTooltipSide("bottom-sheet");
      } else {
        const spaceAbove = rect.top;
        const spaceBelow = vp.height - rect.bottom;
        setTooltipSide(spaceBelow >= spaceAbove ? "below" : "above");
      }
    },
    []
  );

  const goToStep = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      const config = STEPS[next];
      measureTarget(config.target);
      setStep(next);
      setTimeout(() => setAnimating(false), reduced ? 0 : 200);
    },
    [animating, measureTarget, reduced]
  );

  const handleSkip = useCallback(async () => {
    try {
      await fetch("/api/onboarding", { method: "PATCH" });
    } catch {
      // silently fail — component unmounts regardless
    }
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      goToStep(step + 1);
    } else {
      handleComplete();
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      goToStep(step - 1);
    }
  }, [step, goToStep]);

  const handleComplete = useCallback(async () => {
    try {
      await fetch("/api/onboarding", { method: "PATCH" });
    } catch {
      // silently fail
    }
    onComplete();
    if (step === STEPS.length - 1) {
      router.push("/dashboard?create-group=1");
    }
  }, [onComplete, step, router]);

  useEffect(() => {
    const config = STEPS[step];
    if (config.target) {
      measureTarget(config.target);
    } else {
      setCutout(null);
    }
  }, [step, measureTarget]);

  useEffect(() => {
    if (!STEPS[step].target) return;
    const handleScroll = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => measureTarget(STEPS[step].target));
    };
    const handleResize = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => measureTarget(STEPS[step].target));
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [step, measureTarget]);

  if (!mounted) return null;

  const currentStep = STEPS[step];
  const isWelcome = step === 0;
  const isCompletion = step === STEPS.length - 1;
  const totalSteps = STEPS.length - 2;
  const stepInTour = Math.max(0, step);
  const progressPercent = step === 0 ? 0 : ((step - 1) / totalSteps) * 100;

  const pulseAnim = reduced
    ? {}
    : {
        animation: "pulse-ring 2s ease-in-out infinite",
      };

  const page =
    typeof document !== "undefined" ? document.body : null;
  if (!page) return null;

  function renderTooltipContent() {
    return (
      <div className="min-w-[240px] max-w-xs">
        <div className="mb-3 h-1 w-full rounded-full bg-surface-secondary">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs font-medium text-text-muted">
          {step} of {totalSteps}
        </p>
        <h3 className="mt-1 text-base font-semibold text-text-heading">
          {currentStep.headline}
        </h3>
        <p className="mt-1 text-sm text-text-body">
          {currentStep.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step <= 1}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-body transition-colors hover:bg-surface-secondary disabled:opacity-30 min-h-[44px]"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark min-h-[44px]"
          >
            {step < totalSteps ? "Next" : "Done"}
          </button>
        </div>
        <button
          onClick={handleSkip}
          className="mt-2 text-xs text-text-muted underline transition-colors hover:text-text-body"
        >
          Skip Tour
        </button>
      </div>
    );
  }

  function getDesktopTooltipPosition() {
    if (!cutout) return { left: 0, top: 0, pointerEvents: "auto" as const };
    const vp = getViewport();
    const tooltipWidth = 280;
    let left = cutout.x + cutout.width / 2 - tooltipWidth / 2;
    if (left < 12) left = 12;
    if (left + tooltipWidth > vp.width - 12) left = vp.width - tooltipWidth - 12;
    if (tooltipSide === "above") {
      return { left, top: cutout.y - 8, transform: "translateY(-100%)", pointerEvents: "auto" as const };
    }
    return { left, top: cutout.y + cutout.height + 12, pointerEvents: "auto" as const };
  }


  

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (!isWelcome && !isCompletion) {
          e.stopPropagation();
        }
      }}
    >
      {!isWelcome && !isCompletion && cutout && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: cutout.x,
              top: cutout.y,
              width: cutout.width,
              height: cutout.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              borderRadius: "12px",
              transition: reduced
                ? "none"
                : "left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out",
              zIndex: 1,
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: cutout.x - 4,
              top: cutout.y - 4,
              width: cutout.width + 8,
              height: cutout.height + 8,
              zIndex: 2,
            }}
          >
            <div
              className="rounded-xl border-2 border-primary"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "14px",
                ...pulseAnim,
              }}
            />
          </div>
        </>
      )}

      
      {isCompletion ? (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"
          style={{ transition: reduced ? "none" : "opacity 0.2s ease-out" }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-heading">{currentStep.headline}</h2>
            <p className="mt-2 text-sm text-text-body">{currentStep.description}</p>
            <button
              onClick={handleComplete}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Create my first group
            </button>
            <button
              onClick={onComplete}
              className="mt-3 text-sm text-text-muted underline transition-colors hover:text-text-body"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      ) : isWelcome ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-2xl"
            style={{ transition: reduced ? "none" : "opacity 0.2s ease-out, transform 0.2s ease-out" }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-heading">
              Welcome to Splitup{userName ? `, ${userName}` : ""}!
            </h2>
            <p className="mt-2 text-sm text-text-body">
              {currentStep.description}
            </p>
            <button
              onClick={() => goToStep(1)}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Show me around
            </button>
            <button
              onClick={handleSkip}
              className="mt-3 text-sm text-text-muted underline transition-colors hover:text-text-body"
            >
              Skip Tour
            </button>
          </div>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div
              ref={tooltipRef}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface p-4 pb-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ transition: reduced ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out" }}
            >
              {renderTooltipContent()}
            </div>
          ) : (
            <div
              ref={tooltipRef}
              className="absolute z-50"
              onClick={(e) => e.stopPropagation()}
              style={getDesktopTooltipPosition()}
            >
              {renderTooltipContent()}
            </div>
          )}
        </>
      )}
    </div>,
    page
  );
}
