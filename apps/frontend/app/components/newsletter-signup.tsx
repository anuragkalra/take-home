'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setSuccess(null);
      setError('Enter your email to join the newsletter.');
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setSuccess(null);
      setError('Enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await subscribeToNewsletter(trimmedEmail);
      setSuccess(response.message);
      setEmail('');
    } catch (submitError) {
      setSuccess(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Subscription failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 w-full max-w-4xl rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] p-8 text-left shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Newsletter</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Get marketplace updates in your inbox</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Receive product updates, featured inventory, and new sponsorship opportunities without having to check back manually.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby="newsletter-feedback"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>

        <div id="newsletter-feedback" className="min-h-6 text-sm">
          {error ? <p className="text-red-600">{error}</p> : null}
          {!error && success ? <p className="text-emerald-700">{success}</p> : null}
          {!error && !success ? <p className="text-slate-500">We only use your email for occasional marketplace updates.</p> : null}
        </div>
      </form>
    </section>
  );
}
