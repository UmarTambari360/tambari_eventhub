import { TrendingUp, Link, ArrowRight } from "lucide-react";

export function OrganizerCTASection() {
  return (
    <section className="mb-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 px-8 py-14 sm:px-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative max-w-xl">
          <TrendingUp className="h-10 w-10 mb-4 text-white/80" />
          <h2 className="display-md mb-3">Ready to host your event?</h2>
          <p className="body-lg text-white/85 mb-8">
            List your event on Tambari EventHub and sell tickets directly to your audience. Revenue
            lands in your bank account via Paystack — no delays, no middlemen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/become-an-organizer"
              className="btn btn-xl bg-white text-accent-700 hover:bg-amber-50"
            >
              Apply to host
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/events"
              className="btn btn-xl bg-white/15 text-white hover:bg-white/25 border border-white/20"
            >
              Browse first
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
