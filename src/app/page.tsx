'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ui/ScrollReveal';
import HeroIllustration from '@/components/landing/HeroIllustration';

const steps = [
  {
    number: '01',
    title: 'Split an expense',
    desc: 'Add any shared expense — groceries, electricity, dinner out. Choose equal, custom, or percentage split. Everyone gets their fair share calculated instantly.',
  },
  {
    number: '02',
    title: 'See the balance',
    desc: 'At a glance, know exactly who owes what. The dashboard shows net balances per person and recommends the fewest transfers to settle everyone up.',
  },
  {
    number: '03',
    title: 'Settle instantly via UPI',
    desc: 'Tap "Settle Up" and pay directly through your own UPI app via a deep link. No manual bank transfers, no "I\'ll pay you later" that never happens.',
  },
];

const differentiators = [
  {
    title: 'One-tap UPI settlement',
    desc: 'Most expense trackers just tell you who owes what. Splitup generates a UPI deep link so you can pay — and get paid — directly through your own UPI app. No manual transfers, no excuses.',
  },
  {
    title: 'Made for shared living',
    desc: 'Built for the way PG mates, hostel wingmates, and flatmates actually split things. Rent, electricity, wifi, groceries, common supplies — not a general-purpose budgeting tool.',
  },
  {
    title: 'Recurring expenses handled',
    desc: 'Rent and wifi are due every month. Set them once, and Splitup creates the expense automatically on the due date. No re-entering, no forgetting.',
  },
  {
    title: 'Real-time balance tracking',
    desc: 'Every expense updates everyone\'s balance immediately. No end-of-month reconciliation, no confused math, no "Who paid for what last week?"',
  },
];

const faqs = [
  {
    q: 'Does Splitup handle my payment?',
    a: 'No. Splitup generates a UPI deep link that opens your UPI app. The payment happens entirely through your UPI app — Splitup never touches your money. We just help you track who\'s paid and who hasn\'t.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your phone number is used only for login. Payment records (amounts, who paid whom, settlement status) are stored only within your groups. You can see everything stored about you on your profile page at any time.',
  },
  {
    q: 'What if someone disputes a settlement?',
    a: 'If the person who paid says the payment was made and the other person disputes it, the settlement is marked "disputed" and both parties can see it. There\'s no automated resolution — it\'s a signal to talk to your groupmate directly.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, Splitup is completely free to use. There are no hidden charges, premium tiers, or paid features now or planned.',
  },
  {
    q: 'What split methods are supported?',
    a: 'Equal split divides the amount evenly. Custom split lets you enter specific amounts per person. Percentage split lets you assign percentages. All three can handle any combination of group members.',
  },
  {
    q: 'Can I use Splitup for non-UPI payments?',
    a: 'Yes. The app tracks expenses and calculates balances regardless of how you settle up. If your group prefers cash or bank transfer, you can still use Splitup to track who owes whom and manually mark settlements as confirmed.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold text-text-heading transition-colors hover:text-primary sm:text-lg"
        aria-expanded={open}
      >
        <span>{q}</span>
        <span
          className={`shrink-0 text-xl transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '300px' : '0px' }}
      >
        <p className="pb-5 text-sm leading-relaxed text-text-body sm:text-base">{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
        {/* Subtle background rings */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full border border-border/50" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full border border-border/30" />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Text side */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text-heading sm:text-5xl lg:text-6xl">
              Split expenses.
              <br />
              <span className="text-primary">Settle up in one tap.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base text-text-body sm:text-lg lg:mx-0">
              No spreadsheets, no chasing friends. Split group expenses and pay each other back instantly via UPI.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/login"
                className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-text-body hover:underline"
              >
                Already using Splitup? Sign in
              </Link>
            </div>
          </div>

          {/* Illustration side */}
          <div className="flex-1 lg:max-w-md">
            <div className="w-full max-w-sm lg:max-w-full">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <hr className="border-border" />
      </div>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="scroll-mt-14 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                How it works
              </p>
              <h2 className="font-display text-3xl font-bold text-text-heading sm:text-4xl">
                Three taps, not three apps
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-text-body">
                From adding a bill to settling up — it takes about as long as reading this sentence.
              </p>
            </div>
          </ScrollReveal>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line (desktop only) */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-12 hidden border-t-2 border-dashed border-border md:block"
              aria-hidden="true"
              style={{ left: '16.67%', right: '16.67%' }}
            />
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 120}>
                <div className="group relative rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-sm">
                  <span className="font-display text-4xl font-bold text-primary/20 group-hover:text-primary/40">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-text-heading">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-body">{step.desc}</p>
                  {/* Arrow between steps (desktop only) */}
                  {i < steps.length - 1 && (
                    <span
                      className="pointer-events-none absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-lg text-primary/40 md:block"
                      aria-hidden="true"
                    >
                      &#8594;
                    </span>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Splitup ─── */}
      <section className="bg-surface-secondary px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Why Splitup
              </p>
              <h2 className="font-display text-3xl font-bold text-text-heading sm:text-4xl">
                Not just another expense tracker
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-text-body">
                Purpose-built for shared living, not retrofitted from a generic budgeting app.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {differentiators.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <div className="rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-sm sm:p-8">
                  <h3 className="font-display text-lg font-semibold text-text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-body sm:text-base">
                    {item.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Your money, your control ─── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="rounded-2xl border border-border bg-surface-secondary p-8 sm:p-12">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                Your money, your control
              </p>
              <h2 className="font-display text-2xl font-bold text-text-heading sm:text-3xl">
                We track. You pay.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-body sm:text-base">
                <p>
                  Splitup helps you track shared expenses and figure out who owes whom. When you settle
                  up, Splitup generates a UPI deep link that opens your own UPI app (Google Pay, PhonePe,
                  PayTM, etc.) to complete the payment. Splitup never holds, moves, or processes your
                  money. It doesn&apos;t store your bank details, UPI PIN, or payment credentials beyond
                  what&apos;s needed for settlement records (amount, who paid whom, and the status —
                  pending, confirmed, or disputed).
                </p>
                <p>
                  If someone says they&apos;ve paid, you confirm in the app. If something&apos;s wrong,
                  you can dispute it. Everything is transparent between the people in your group.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Built for group living in India ─── */}
      <section className="bg-surface-secondary px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
              {/* Image */}
              <div className="w-full md:w-2/5">
                <div className="overflow-hidden rounded-2xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Friends sharing a meal together at a restaurant table"
                    className="h-64 w-full object-cover sm:h-80"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Built for group living in India
                </p>
                <h2 className="font-display text-2xl font-bold text-text-heading sm:text-3xl">
                  Made for how Indian roommates actually live
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-body sm:text-base">
                  <p>
                    PG splits, hostel wing expenses, shared flat rent and utilities — in Indian group
                    living, someone always fronts the bill and everyone else pays them back. Splitup was
                    built for that specific flow: one person pays, the app calculates everyone&apos;s
                    share in their preferred split method, and settlement happens via UPI.
                  </p>
                  <p>
                    No spreadsheets, no chasing people for money, no awkward group-chat math.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="scroll-mt-14 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                FAQ
              </p>
              <h2 className="font-display text-3xl font-bold text-text-heading sm:text-4xl">
                Questions and answers
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="bg-primary px-4 py-20 sm:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to stop chasing payments?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/80">
              Create your first group for free. No credit card, no onboarding call — just your phone number.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-xl bg-white px-10 py-3.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-white/90"
            >
              Create Your First Group
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-center text-sm text-text-muted sm:flex-row">
          <span className="font-display font-semibold text-text-body">Splitup</span>
          <span>Built for shared living.</span>
        </div>
      </footer>
    </div>
  );
}
