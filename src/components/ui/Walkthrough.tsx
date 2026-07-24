"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

interface StepConfig {
  headline: string;
  description: string;
  target?: string;
}

const STEPS: StepConfig[] = [
  {
    headline: "Welcome to Splitup!",
    description: "Let's show you around --- takes 30 seconds.",
  },
  {
    headline: "Your Groups",
    description:
      "Your groups live here --- PG, hostel, or a trip. Create one and add your roommates.",
    target: "[data-walkthrough='groups']",
  },
  {
    headline: "Create a Group",
    description:
      "Start here --- create a group for your flat or PG and invite your roommates via a WhatsApp link.",
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
      "This is your live balance --- who owes you and how much, always up to date.",
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
    description: "Create your first group to get started.",
  },
];

// Phase 1: create-group (steps 0, 1, 2, 6) --- shown before any group exists
// Phase 2: use-features (steps 3, 4, 5, 6) --- shown after creating first group
const TOTAL_PHASE_STEPS = 3;
const DESKTOP_BREAKPOINT = 768;
const OVERLAY_Z = 9999;
const TOOLTIP_ESTIMATED_HEIGHT = 220;

function getPhaseSteps(phase: string) {
  if (phase === "use-features") return [3, 4, 5, 6];
  return [0, 1, 2, 6]; // create-group
}

function getTotalTourSteps(phase: string) {
  if (phase === "use-features") return 3;
  return 2;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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

function isMobileViewport(w: number) {
  return w < DESKTOP_BREAKPOINT;
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  reverse = false
): string {
  r = Math.min(r, w / 2, h / 2);
  if (reverse) {
    return [
      `M ${x},${y + r}`,
      `L ${x},${y + h - r}`,
      `A ${r},${r} 0 0,0 ${x + r},${y + h}`,
      `L ${x + w - r},${y + h}`,
      `A ${r},${r} 0 0,0 ${x + w},${y + h - r}`,
      `L ${x + w},${y + r}`,
      `A ${r},${r} 0 0,0 ${x + w - r},${y}`,
      `L ${x + r},${y}`,
      `A ${r},${r} 0 0,0 ${x},${y + r}`,
      "Z",
    ].join(" ");
  }
  return [
    `M ${x + r},${y}`,
    `L ${x + w - r},${y}`,
    `A ${r},${r} 0 0,1 ${x + w},${y + r}`,
    `L ${x + w},${y + h - r}`,
    `A ${r},${r} 0 0,1 ${x + w - r},${y + h}`,
    `L ${x + r},${y + h}`,
    `A ${r},${r} 0 0,1 ${x},${y + h - r}`,
    `L ${x},${y + r}`,
    `A ${r},${r} 0 0,1 ${x + r},${y}`,
    "Z",
  ].join(" ");
}

function getSpotlightPath(cutout: Rect | null, vp: { w: number; h: number }): string | null {
  if (!cutout) return null;
  return (
    `M 0,0 L ${vp.w},0 L ${vp.w},${vp.h} L 0,${vp.h} Z ` +
    roundedRectPath(
      cutout.x - 8,
      cutout.y - 8,
      cutout.width + 16,
      cutout.height + 16,
      12,
      true
    )
  );
}
export default function Walkthrough({
  userId: _userId,
  userName: _userName,
  onComplete,
  phase = "create-group",
}: {
  userId?: string;
  userName?: string;
  onComplete?: () => void;
  phase?: "create-group" | "use-features";
} = {}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const stepIndices = getPhaseSteps(phase);
  const totalSteps = getTotalTourSteps(phase);
  const effectiveStep = step >= stepIndices.length ? 0 : step;

  useEffect(() => { setMounted(true); }, []);

  const isCompletionStep = effectiveStep === stepIndices.length - 1;

  const updateDimensions = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const rawCfg = STEPS[stepIndices[effectiveStep]];
  const cfg: StepConfig = isCompletionStep && phase === "use-features"
    ? { ...rawCfg, description: "Start adding expenses and invite roommates to get going." }
    : rawCfg;
    if (cfg.target) {
      const el = document.querySelector(cfg.target);
      if (el) setTargetRect(el.getBoundingClientRect().toJSON() as Rect);
      else setTargetRect(null);
    } else {
      setTargetRect(null);
    }
  }, [step, phase]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  useEffect(() => {
    if (targetRect && !isMobileViewport(vp.w)) {
      const scrollY = window.scrollY;
      const targetCenter = targetRect.y + targetRect.height / 2 + scrollY;
      const vpCenter = vp.h / 2 + scrollY;
      const offset = targetCenter - vpCenter;
      if (Math.abs(offset) > 80) {
        window.scrollBy({ top: offset, behavior: reduced ? "instant" as any : "smooth" });
      }
    }
  }, [targetRect, reduced, vp]);

  const isFirst = effectiveStep === 0;
  const isLast = effectiveStep === stepIndices.length - 1;
  const tourProgress = isFirst ? 0 : isLast ? totalSteps : Math.min(effectiveStep, totalSteps);
  const tourIndex = isFirst ? 0 : isLast ? totalSteps : Math.min(effectiveStep, totalSteps);

  const handleNext = useCallback(() => {
    if (isLast) {
      if (phase === "create-group") {
        localStorage.setItem(STORAGE_KEYS.WALKTHROUGH_CREATE_DONE, "true");
      } else {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
      }
      onComplete?.();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLast, phase, onComplete]);

  const handleSkip = useCallback(() => {
    if (phase === "create-group") {
      localStorage.setItem(STORAGE_KEYS.WALKTHROUGH_CREATE_DONE, "true");
    } else {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
    }
    onComplete?.();
  }, [phase, onComplete]);

  if (!mounted) return null;
  // If step is out of range for this phase, reset
  const spotlightPath = getSpotlightPath(targetRect, vp);
  const isMobile = isMobileViewport(vp.w);
  const cfg = STEPS[stepIndices[effectiveStep]];

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Semi-transparent overlay with cutout */}
      {spotlightPath && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "auto" }}
        >
          <path
            d={spotlightPath}
            fill="rgba(0,0,0,0.6)"
            fillRule="evenodd"
          />
        </svg>
      )}

      {/* Pulse ring */}
      {targetRect && !reduced && (
        <div
          className="absolute rounded-xl animate-spotlight-pulse"
          style={{
            left: targetRect.x - 12,
            top: targetRect.y - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
            border: "3px solid rgba(255,255,255,0.85)",
            pointerEvents: "none",
            boxShadow: "0 0 20px rgba(255,255,255,0.3)",
          }}
        />
      )}

      {/* Desktop tooltip card */}
      {!isMobile && (
        <DesktopTooltip
          step={step}
          isFirst={isFirst}
          isLast={isLast}
          tourProgress={tourProgress}
          tourIndex={tourIndex}
          totalSteps={totalSteps}
          targetRect={targetRect}
          vp={vp}
          cfg={cfg}
          onNext={handleNext}
          onSkip={handleSkip}
          reduced={reduced}
        />
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          step={step}
          isFirst={isFirst}
          isLast={isLast}
          tourProgress={tourProgress}
          tourIndex={tourIndex}
          totalSteps={totalSteps}
          cfg={cfg}
          onNext={handleNext}
          onSkip={handleSkip}
          reduced={reduced}
        />
      )}
    </div>,
    document.body
  );
}
function DesktopTooltip({
  step, isFirst, isLast, tourProgress, tourIndex, totalSteps, targetRect, vp, cfg, onNext, onSkip, reduced
}: {
  step: number; isFirst: boolean; isLast: boolean;
  tourProgress: number; tourIndex: number;
  totalSteps: number;
  targetRect: Rect | null; vp: { w: number; h: number };
  cfg: StepConfig;
  onNext: () => void; onSkip: () => void;
  reduced: boolean;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position tooltip relative to target
  const [pos, setPos] = useState({ left: 0, top: 0, arrow: "" });
  useEffect(() => {
    if (!tooltipRef.current || !targetRect) return;
    const t = tooltipRef.current;
    const tw = t.offsetWidth || 300;
    const th = t.offsetHeight || 200;
    const margin = 16;
    const gap = 12;

    const centerX = targetRect.x + targetRect.width / 2 - tw / 2;
    const clampedX = Math.max(margin, Math.min(centerX, vp.w - tw - margin));

    const belowY = targetRect.y + targetRect.height + gap;
    const aboveY = targetRect.y - th - gap;

    let top: number;
    let arrowDir: string;
    if (belowY + th <= vp.h) {
      top = belowY;
      arrowDir = "up";
    } else if (aboveY >= 0) {
      top = aboveY;
      arrowDir = "down";
    } else {
      top = Math.max(margin, vp.h - th - margin);
      arrowDir = "";
    }

    setPos({ left: clampedX, top, arrow: arrowDir });
  }, [targetRect, vp, reduced]);
  const nonTour = isFirst || isLast;

  return (
    <div
      ref={tooltipRef}
      className="fixed w-72 bg-white rounded-xl shadow-2xl z-10 transition-all duration-300"
      style={{
        left: pos.left,
        top: pos.top,
        opacity: pos.left === 0 && pos.top === 0 ? 0 : 1,
      }}
    >
      {/* Arrow */}
      {pos.arrow === "up" && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid white",
          }}
        />
      )}
      {pos.arrow === "down" && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid white",
          }}
        />
      )}

      {/* Content */}
      <div className="p-5">
        {/* Step counter */}
        {!nonTour && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
             style={{ color: "var(--color-primary)" }}>
            Step {tourIndex} of {totalSteps}
          </p>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{cfg.headline}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{cfg.description}</p>

        {/* Progress dots */}
        {!nonTour && (
          <div className="flex items-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i < tourIndex ? 24 : 6,
                  height: 6,
                  backgroundColor: i < tourIndex
                    ? "var(--color-primary)"
                    : "var(--color-primary)",
                  opacity: i < tourIndex ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onSkip}
            className="text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {isLast ? "Got it" : "Skip Tour"}
          </button>
          <button
            onClick={onNext}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {isFirst ? "Show me around" : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
function MobileBottomSheet({
  step, isFirst, isLast, tourProgress, tourIndex, totalSteps, cfg, onNext, onSkip, reduced
}: {
  step: number; isFirst: boolean; isLast: boolean;
  tourProgress: number; tourIndex: number;
  totalSteps: number;
  cfg: StepConfig;
  onNext: () => void; onSkip: () => void;
  reduced: boolean;
}) {
  const nonTour = isFirst || isLast;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-10 transition-transform duration-400"
      style={{
        transform: visible ? "translateY(0%)" : "translateY(100%)",
        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        transitionProperty: reduced ? "none" as any : "transform",
      }}
    >
      <div className="bg-white rounded-t-2xl shadow-2xl px-6 pt-5 pb-9">

        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 bg-gray-300 rounded-full mb-4" />

        {/* Step counter */}
        {!nonTour && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
             style={{ color: "var(--color-primary)" }}>
            Step {tourIndex} of {totalSteps}
          </p>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-1.5">{cfg.headline}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{cfg.description}</p>

        {/* Progress dots */}
        {!nonTour && (
          <div className="flex items-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i < tourIndex ? 24 : 6,
                  height: 6,
                  backgroundColor: i < tourIndex
                    ? "var(--color-primary)"
                    : "var(--color-primary)",
                  opacity: i < tourIndex ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onSkip}
            className="text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {isLast ? "Got it" : "Skip Tour"}
          </button>
          <button
            onClick={onNext}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {isFirst ? "Show me around" : isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
