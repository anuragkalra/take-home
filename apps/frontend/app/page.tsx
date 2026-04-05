import { NewsletterSignup } from './components/newsletter-signup';

// TODO: This should be a marketing landing page, not just a simple welcome screen
// TODO: Add proper metadata for SEO (title, description, Open Graph)
// TODO: Add hero section, features, testimonials, etc.
// HINT: Check out the bonus challenge for marketing landing page!

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center py-12 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-950">Welcome to Anvara</h1>
      <p className="mb-8 max-w-md text-slate-500">
        The sponsorship marketplace connecting sponsors with publishers.
      </p>

      <div className="flex gap-4">
        <a
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Get Started
        </a>
      </div>

      <div className="mt-16 grid w-full gap-8 text-left sm:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">For Sponsors</p>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-950">Run campaigns with more control</h2>
          <p className="text-sm leading-6 text-slate-500">
            Create campaigns, set budgets, and reach your target audience through premium
            publishers.
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">For Publishers</p>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-950">Monetize inventory with clarity</h2>
          <p className="text-sm leading-6 text-slate-500">
            List your ad slots, set your rates, and connect with sponsors looking for your audience.
          </p>
        </div>
      </div>

      <NewsletterSignup />
    </div>
  );
}
