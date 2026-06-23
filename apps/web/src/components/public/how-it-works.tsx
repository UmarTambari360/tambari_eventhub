import { CalendarDays, Zap, Shield } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: <CalendarDays className="h-6 w-6" />,
      step: '01',
      title: 'Find your event',
      description:
        'Browse events by category, city, or date. Filter by price — including hundreds of free events.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      step: '02',
      title: 'Book in seconds',
      description:
        'Select your tickets, fill in attendee details, and pay securely via card, bank transfer, or USSD through Paystack.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      step: '03',
      title: 'Show up and scan',
      description:
        'Your QR code ticket arrives by email instantly. Present it at the door — no printing needed.',
    },
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-10">
        <p className="overline text-text-muted mb-2">Simple by design</p>
        <h2 className="display-md text-text-primary">How it works</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.step}
            className="relative rounded-2xl border border-border bg-surface-overlay p-7"
          >
            {/* Connector line between cards (desktop) */}
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className="hidden sm:block absolute top-10 -right-3 w-6 h-px bg-border z-10"
              />
            )}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                {step.icon}
              </div>
              <span className="text-3xl font-black text-border-strong tabular-nums select-none">
                {step.step}
              </span>
            </div>
            <h3 className="heading-md text-text-primary mb-2">{step.title}</h3>
            <p className="body-sm text-text-muted leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}