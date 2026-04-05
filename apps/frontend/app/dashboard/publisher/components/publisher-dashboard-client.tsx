'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AdSlot } from '@/lib/types';
import {
  createAdSlot,
  deleteAdSlot,
  type PublisherActionState,
  updateAdSlot,
} from '../actions';

const initialState: PublisherActionState = {};
const adSlotTypes = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;
const ITEMS_PER_PAGE = 10;

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100';
const labelClassName = 'space-y-2 text-sm font-medium text-slate-700';
const errorClassName = 'text-xs text-red-600';
const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900';

function SubmitButton({
  idleText,
  pendingText,
  variant = 'primary',
}: {
  idleText: string;
  pendingText: string;
  variant?: 'primary' | 'danger';
}) {
  const { pending } = useFormStatus();
  const className =
    variant === 'danger'
      ? 'inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70'
      : 'inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70';

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}

function FormError({ state }: { state: PublisherActionState }) {
  if (!state.error) {
    return null;
  }

  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>;
}

function FieldError({
  state,
  field,
}: {
  state: PublisherActionState;
  field: string;
}) {
  const message = state.fieldErrors?.[field];
  return message ? <p className={errorClassName}>{message}</p> : null;
}

function AdSlotFormFields({
  state,
  adSlot,
}: {
  state: PublisherActionState;
  adSlot?: AdSlot;
}) {
  return (
    <>
      <label className={labelClassName}>
        <span>Name</span>
        <input
          name="name"
          defaultValue={adSlot?.name ?? ''}
          className={inputClassName}
          placeholder="Homepage banner"
        />
        <FieldError state={state} field="name" />
      </label>

      <label className={labelClassName}>
        <span>Description</span>
        <textarea
          name="description"
          defaultValue={adSlot?.description ?? ''}
          rows={3}
          className={`${inputClassName} resize-y`}
          placeholder="Describe the placement and audience."
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          <span>Type</span>
          <select
            name="type"
            defaultValue={adSlot?.type ?? 'DISPLAY'}
            className={inputClassName}
          >
            {adSlotTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError state={state} field="type" />
        </label>

        <label className={labelClassName}>
          <span>Price</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-medium text-slate-400">
              $
            </span>
            <input
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={adSlot ? Number(adSlot.basePrice) : ''}
              className={`${inputClassName} pl-8`}
              placeholder="250"
            />
          </div>
          <FieldError state={state} field="basePrice" />
        </label>
      </div>

      <label className={labelClassName}>
        <span>Position</span>
        <input
          name="position"
          defaultValue={'position' in (adSlot ?? {}) ? ((adSlot as AdSlot & { position?: string }).position ?? '') : ''}
          className={inputClassName}
          placeholder="Sidebar, hero, newsletter top"
        />
      </label>
    </>
  );
}

function CreateAdSlotForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(createAdSlot, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    onClose();
    onSuccess();
  }, [onClose, onSuccess, state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-7"
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Create an ad slot</h2>
            <p className="text-sm text-slate-500">Add a placement with a clear description, type, and base price.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close create ad slot modal"
          >
            ×
          </button>
        </div>
      </div>
      <FormError state={state} />
      <AdSlotFormFields state={state} />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">
        <SubmitButton idleText="Create Ad Slot" pendingText="Saving..." />
        <button
          type="button"
          onClick={onClose}
          className={secondaryButtonClassName}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CreateAdSlotModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close create ad slot modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl">
        <CreateAdSlotForm onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

function DeleteAdSlotForm({
  id,
  name,
  onSuccess,
}: {
  id: string;
  name: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(deleteAdSlot, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [onSuccess, state.success]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}"?`)) {
          event.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={id} />
      {state.error ? <p className={errorClassName}>{state.error}</p> : null}
      <SubmitButton idleText="Delete" pendingText="Deleting..." variant="danger" />
    </form>
  );
}

function AdSlotItem({
  adSlot,
  onSuccess,
}: {
  adSlot: AdSlot;
  onSuccess: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useFormState(updateAdSlot, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const position =
    'position' in adSlot && typeof adSlot.position === 'string' && adSlot.position.length > 0
      ? adSlot.position
      : 'Not specified';

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    setIsEditing(false);
    onSuccess('Ad slot updated.');
  }, [onSuccess, state.success]);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]">
      <div className="flex min-h-[22rem] flex-1 flex-col border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0))] p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="space-y-3">
              <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-950">{adSlot.name}</h2>
              {adSlot.description ? (
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600">{adSlot.description}</p>
              ) : null}
              <p className="text-base font-medium text-slate-500">
                {adSlot.type}
              </p>
            </div>
          </div>
          <span
            className={`mt-1 inline-flex items-center self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] ${
              adSlot.isAvailable
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700'
            }`}
          >
            {adSlot.isAvailable ? 'Available' : 'Booked'}
          </span>
        </div>

        <div className="mt-auto pt-7">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Pricing</p>
              <p className="text-sm font-semibold text-slate-700">Monthly rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                ${Number(adSlot.basePrice).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">per month</p>
            </div>
            <div className="grid gap-4 border-t border-slate-200/80 pt-4 sm:grid-cols-1">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Placement</p>
                <p className="text-base font-semibold text-slate-800">{position}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form ref={formRef} action={formAction} className="space-y-6 border-t border-slate-200 bg-slate-50/70 p-6">
          <input type="hidden" name="id" value={adSlot.id} />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Edit ad slot</h3>
            <p className="text-sm text-slate-500">Update the placement details sponsors rely on most.</p>
          </div>
          <FormError state={state} />
          <AdSlotFormFields state={state} adSlot={adSlot} />

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-2">
            <SubmitButton idleText="Save Changes" pendingText="Saving..." />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end border-t border-slate-200 bg-slate-50/55 px-7 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={secondaryButtonClassName}
            >
              Edit
            </button>
            <DeleteAdSlotForm id={adSlot.id} name={adSlot.name} onSuccess={() => onSuccess('Ad slot deleted.')} />
          </div>
        </div>
      )}
    </article>
  );
}

function Pagination({
  page,
  totalItems,
  onPrevious,
  onNext,
}: {
  page: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, totalItems);
  const hasPrevious = page > 1;
  const hasNext = end < totalItems;
  const buttonClassName =
    'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:bg-white';

  if (totalItems <= ITEMS_PER_PAGE) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500">
      <span>{start}-{end} of {totalItems}</span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label="Previous page"
        className={buttonClassName}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next page"
        className={buttonClassName}
      >
        ›
      </button>
    </div>
  );
}

export function PublisherDashboardClient({ adSlots }: { adSlots: AdSlot[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(adSlots.length / ITEMS_PER_PAGE));
  const paginatedAdSlots = adSlots.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Ad Slots</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Keep your inventory organized and presentation-ready so sponsors can understand each opportunity at a glance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total slots</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{adSlots.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating((value) => !value)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {isCreating ? 'Close Create Form' : 'Create New Ad Slot'}
            </button>
          </div>
        </div>
      </section>

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {feedback}
        </div>
      ) : null}

      <div className="space-y-6">
        {adSlots.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
            <div className="mx-auto max-w-md space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">No ad slots yet</h2>
              <p className="text-sm leading-6 text-slate-500">
                Create your first listing to start showcasing inventory and collecting sponsor interest.
              </p>
            </div>
          </div>
        ) : (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Active inventory</h2>
              </div>
              <Pagination
                page={page}
                totalItems={adSlots.length}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {paginatedAdSlots.map((adSlot) => (
                <AdSlotItem key={adSlot.id} adSlot={adSlot} onSuccess={setFeedback} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateAdSlotModal
        key={createFormKey}
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={() => {
          setFeedback('Ad slot created.');
          setCreateFormKey((value) => value + 1);
        }}
      />
    </div>
  );
}
