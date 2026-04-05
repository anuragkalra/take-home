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

const inputClassName =
  'w-full rounded-md border border-[--color-border] bg-white px-3 py-2 text-sm outline-none transition focus:border-[--color-primary]';
const labelClassName = 'space-y-1 text-sm';
const errorClassName = 'text-xs text-red-600';

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
      ? 'rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70'
      : 'rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70';

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

  return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>;
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
          <input
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={adSlot ? Number(adSlot.basePrice) : ''}
            className={inputClassName}
            placeholder="250"
          />
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
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
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

  if (!open) {
    return null;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-[--color-border] bg-white p-5 shadow-sm">
      <FormError state={state} />
      <AdSlotFormFields state={state} />

      <div className="flex items-center gap-3">
        <SubmitButton idleText="Create Ad Slot" pendingText="Saving..." />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[--color-border] px-3 py-2 text-sm text-[--color-muted] hover:text-[--color-foreground]"
        >
          Cancel
        </button>
      </div>
    </form>
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
      className="space-y-2"
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

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    setIsEditing(false);
    onSuccess('Ad slot updated.');
  }, [onSuccess, state.success]);

  return (
    <article className="space-y-4 rounded-xl border border-[--color-border] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{adSlot.name}</h2>
          <p className="text-sm text-[--color-muted]">
            {adSlot.type} • ${Number(adSlot.basePrice).toLocaleString()}/mo
          </p>
          {adSlot.description ? (
            <p className="text-sm text-[--color-muted]">{adSlot.description}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            adSlot.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {adSlot.isAvailable ? 'Available' : 'Booked'}
        </span>
      </div>

      {isEditing ? (
        <form ref={formRef} action={formAction} className="space-y-4 border-t border-[--color-border] pt-4">
          <input type="hidden" name="id" value={adSlot.id} />
          <FormError state={state} />
          <AdSlotFormFields state={state} adSlot={adSlot} />

          <div className="flex items-center gap-3">
            <SubmitButton idleText="Save Changes" pendingText="Saving..." />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-[--color-border] px-3 py-2 text-sm text-[--color-muted] hover:text-[--color-foreground]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 border-t border-[--color-border] pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-[--color-border] px-3 py-2 text-sm hover:bg-gray-50"
          >
            Edit
          </button>
          <DeleteAdSlotForm id={adSlot.id} name={adSlot.name} onSuccess={() => onSuccess('Ad slot deleted.')} />
        </div>
      )}
    </article>
  );
}

export function PublisherDashboardClient({ adSlots }: { adSlots: AdSlot[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Ad Slots</h1>
        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          {isCreating ? 'Close Create Form' : '+ Create New Ad Slot'}
        </button>
      </div>

      {feedback ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      ) : null}

      <CreateAdSlotForm
        key={createFormKey}
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={() => {
          setFeedback('Ad slot created.');
          setCreateFormKey((value) => value + 1);
        }}
      />

      {adSlots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
          No ad slots yet. Create your first ad slot to start earning.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {adSlots.map((adSlot) => (
            <AdSlotItem key={adSlot.id} adSlot={adSlot} onSuccess={setFeedback} />
          ))}
        </div>
      )}
    </div>
  );
}
