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
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100';
const labelClassName = 'space-y-2 text-sm font-medium text-slate-700';
const errorClassName = 'text-xs text-red-600';
const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900';

function getCampaignStatusBadgeClassName(status: Campaign['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'APPROVED':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'PENDING_REVIEW':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'COMPLETED':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'PAUSED':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'DRAFT':
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

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
      ? 'inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70'
      : 'inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70';

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

  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>;
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
  onClose,
  onSuccess,
}: {
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

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-7"
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Create a campaign</h2>
            <p className="text-sm text-slate-500">Define the goal, budget, and timing before you start booking placements.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close create campaign modal"
          >
            ×
          </button>
        </div>
      </div>
      <FormError state={state} />
      <CampaignFormFields state={state} draft={draft} onFieldChange={handleFieldChange} />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">
        <SubmitButton idleText="Create Campaign" pendingText="Saving..." />
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

function CreateCampaignModal({
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
        aria-label="Close create campaign modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl">
        <CreateCampaignForm onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
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
      className="space-y-3"
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
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]">
      <div className="flex min-h-[25rem] flex-1 flex-col border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0))] p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="space-y-3">
              <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-950">{campaign.name}</h2>
              {campaign.description ? (
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600">{campaign.description}</p>
              ) : null}
            </div>
          </div>
          <span
            className={`mt-1 inline-flex items-center self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] ${getCampaignStatusBadgeClassName(campaign.status)}`}
          >
            {campaign.status}
          </span>
        </div>

        <div className="mt-auto pt-7">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Budget</p>
              <p className="text-sm font-semibold text-slate-700">{Math.round(Math.min(progress, 100))}% used</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                ${Number(campaign.spent).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">
                spent of ${Number(campaign.budget).toLocaleString()}
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200">
              <div
                className="h-2.5 rounded-full bg-slate-900"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="grid gap-4 border-t border-slate-200/80 pt-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Timeline</p>
                <p className="text-base font-semibold text-slate-800">
                  {new Date(campaign.startDate).toLocaleDateString()} to {new Date(campaign.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Remaining budget</p>
                <p className="text-base font-semibold text-slate-800">
                  ${Math.max(Number(campaign.budget) - Number(campaign.spent), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form ref={formRef} action={formAction} className="space-y-6 border-t border-slate-200 bg-slate-50/70 p-6">
          <input type="hidden" name="id" value={campaign.id} />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Edit campaign</h3>
            <p className="text-sm text-slate-500">Adjust the campaign brief, budget, or dates while keeping the structure consistent.</p>
          </div>
          <FormError state={state} />
          <CampaignFormFields state={state} campaign={campaign} />

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
            <DeleteCampaignForm
              id={campaign.id}
              name={campaign.name}
              onSuccess={() => onSuccess('Campaign deleted.')}
            />
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
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Campaigns</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Track spend, timing, and campaign readiness in a layout that matches the publisher side of the product.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <div className="flex h-12 flex-none flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total campaigns</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{campaigns.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating((value) => !value)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Create New Campaign
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
        {campaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
            <div className="mx-auto max-w-md space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">No campaigns yet</h2>
              <p className="text-sm leading-6 text-slate-500">
                Create your first campaign to set budget, timeline, and goals before booking placements.
              </p>
            </div>
          </div>
        ) : (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Active campaigns</h2>
              </div>
              <Pagination
                page={page}
                totalItems={campaigns.length}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {paginatedCampaigns.map((campaign) => (
                <CampaignItem key={campaign.id} campaign={campaign} onSuccess={setFeedback} />
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateCampaignModal
        key={createFormKey}
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={() => {
          setFeedback('Campaign created.');
          setCreateFormKey((value) => value + 1);
        }}
      />
    </div>
  );
}
