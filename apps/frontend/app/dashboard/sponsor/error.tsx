'use client';

export default function SponsorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
        {error.message || 'Failed to load campaigns'}
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded border border-[--color-border] px-3 py-1.5 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
