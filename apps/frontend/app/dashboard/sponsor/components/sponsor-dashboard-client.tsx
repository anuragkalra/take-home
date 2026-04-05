'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { Campaign } from '@/lib/types';
import {
  createCampaign,
  deleteCampaign,
  type SponsorActionState,
  updateCampaign,
} from '../actions';

const initialState: SponsorActionState = {};
const ITEMS_PER_PAGE = 10;
const inputClassName =
  'w-full rounded-md border border-[--color-border] bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200';
const labelClassName = 'space-y-1 text-sm';
const errorClassName = 'text-xs text-red-600';

type CampaignDraft = {
  name: string;
  description: string;
  budget: string;
  startDate: string;
  endDate: string;
};

const emptyDraft: CampaignDraft = {
  name: '',
  description: '',
  budget: '',
  startDate: '',
  endDate: '',
};

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

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

function FormError({ state }: { state: SponsorActionState }) {
  if (!state.error) {
    return null;
  }

  return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>;
}

function FieldError({
  state,
  field,
}: {
  state: SponsorActionState;
  field: string;
}) {
  const message = state.fieldErrors?.[field];
  return message ? <p className={errorClassName}>{message}</p> : null;
}

function CampaignFormFields({
  state,
  campaign,
  draft,
  onFieldChange,
}: {
  state: SponsorActionState;
  campaign?: Campaign;
  draft?: CampaignDraft;
  onFieldChange?: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const inputClass = (field: string) =>
    `${inputClassName} ${state.fieldErrors?.[field] ? 'border-red-500 bg-red-50' : ''}`;
  const getInputProps = (field: keyof CampaignDraft, fallbackValue: string) =>
    draft && onFieldChange
      ? { value: draft[field], onChange: onFieldChange }
      : { defaultValue: fallbackValue };

  return (
    <>
      <label className={labelClassName}>
        <span>Name</span>
        <input
          name="name"
          {...getInputProps('name', campaign?.name ?? '')}
          className={inputClass('name')}
          placeholder="Spring Launch"
        />
        <FieldError state={state} field="name" />
      </label>

      <label className={labelClassName}>
        <span>Description</span>
        <textarea
          name="description"
          {...getInputProps('description', campaign?.description ?? '')}
          rows={3}
          className={`${inputClass('description')} resize-y`}
          placeholder="Summarize the campaign goals and audience."
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClassName}>
          <span>Budget</span>
          <input
            name="budget"
            type="number"
            min="0"
            step="0.01"
            {...getInputProps('budget', campaign ? String(Number(campaign.budget)) : '')}
            className={inputClass('budget')}
            placeholder="5000"
          />
          <FieldError state={state} field="budget" />
        </label>

        <label className={labelClassName}>
          <span>Start Date</span>
          <input
            name="startDate"
            type="date"
            {...getInputProps('startDate', campaign ? toDateInputValue(campaign.startDate) : '')}
            className={inputClass('startDate')}
          />
          <FieldError state={state} field="startDate" />
        </label>

        <label className={labelClassName}>
          <span>End Date</span>
          <input
            name="endDate"
            type="date"
            {...getInputProps('endDate', campaign ? toDateInputValue(campaign.endDate) : '')}
            className={inputClass('endDate')}
          />
          <FieldError state={state} field="endDate" />
        </label>
      </div>
    </>
  );
}

function CreateCampaignForm({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(createCampaign, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<CampaignDraft>(emptyDraft);

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    setDraft(emptyDraft);
    onClose();
    onSuccess();
  }, [onClose, onSuccess, state.success]);

  if (!open) {
    return null;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-[--color-border] bg-white p-5 shadow-sm">
      <FormError state={state} />
      <CampaignFormFields state={state} draft={draft} onFieldChange={handleFieldChange} />

      <div className="flex items-center gap-3">
        <SubmitButton idleText="Create Campaign" pendingText="Saving..." />
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

function DeleteCampaignForm({
  id,
  name,
  onSuccess,
}: {
  id: string;
  name: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(deleteCampaign, initialState);

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

function CampaignItem({
  campaign,
  onSuccess,
}: {
  campaign: Campaign;
  onSuccess: (message: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useFormState(updateCampaign, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const progress =
    Number(campaign.budget) > 0
      ? (Number(campaign.spent) / Number(campaign.budget)) * 100
      : 0;

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    setIsEditing(false);
    onSuccess('Campaign updated.');
  }, [onSuccess, state.success]);

  return (
    <article className="space-y-4 rounded-xl border border-[--color-border] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{campaign.name}</h2>
          <p className="text-sm text-[--color-muted]">
            ${Number(campaign.spent).toLocaleString()} spent of $
            {Number(campaign.budget).toLocaleString()}
          </p>
          {campaign.description ? (
            <p className="text-sm text-[--color-muted]">{campaign.description}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {campaign.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[--color-primary]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-[--color-muted]">
          {new Date(campaign.startDate).toLocaleDateString()} to{' '}
          {new Date(campaign.endDate).toLocaleDateString()}
        </p>
      </div>

      {isEditing ? (
        <form ref={formRef} action={formAction} className="space-y-4 border-t border-[--color-border] pt-4">
          <input type="hidden" name="id" value={campaign.id} />
          <FormError state={state} />
          <CampaignFormFields state={state} campaign={campaign} />

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
          <DeleteCampaignForm
            id={campaign.id}
            name={campaign.name}
            onSuccess={() => onSuccess('Campaign deleted.')}
          />
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
    'flex h-10 w-10 items-center justify-center rounded-full text-3xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent';

  if (totalItems <= ITEMS_PER_PAGE) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm text-slate-500">
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

export function SponsorDashboardClient({ campaigns }: { campaigns: Campaign[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(campaigns.length / ITEMS_PER_PAGE));
  const paginatedCampaigns = campaigns.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsCreating((value) => !value)}
            className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            {isCreating ? 'Close Create Form' : '+ Create New Campaign'}
          </button>
          <Pagination
            page={page}
            totalItems={campaigns.length}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </div>
      </div>

      {feedback ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      ) : null}

      <CreateCampaignForm
        key={createFormKey}
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={() => {
          setFeedback('Campaign created.');
          setCreateFormKey((value) => value + 1);
        }}
      />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
          No campaigns yet. Create your first campaign to get started.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {paginatedCampaigns.map((campaign) => (
            <CampaignItem key={campaign.id} campaign={campaign} onSuccess={setFeedback} />
          ))}
        </div>
      )}
    </div>
  );
}
