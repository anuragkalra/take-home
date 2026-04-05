'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export type SponsorActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function getSessionCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (!cookieHeader) {
    throw new Error('You must be logged in to manage campaigns');
  }

  return cookieHeader;
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    if (typeof body.error === 'string' && body.error.trim() !== '') {
      return body.error;
    }
  } catch {
    // Ignore malformed error bodies and fall back to a generic message.
  }

  return 'Request failed';
}

function parseRequiredString(
  formData: FormData,
  field: string,
  label: string,
  fieldErrors: Record<string, string>,
) {
  const value = formData.get(field);

  if (typeof value !== 'string' || value.trim() === '') {
    fieldErrors[field] = `${label} is required`;
    return null;
  }

  return value.trim();
}

function parseOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseBudget(formData: FormData, fieldErrors: Record<string, string>) {
  const value = formData.get('budget');

  if (typeof value !== 'string' || value.trim() === '') {
    fieldErrors.budget = 'Budget is required';
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors.budget = 'Budget must be a valid number greater than or equal to 0';
    return null;
  }

  return parsed;
}

function validateCampaignForm(formData: FormData) {
  const fieldErrors: Record<string, string> = {};
  const name = parseRequiredString(formData, 'name', 'Name', fieldErrors);
  const budget = parseBudget(formData, fieldErrors);
  const startDate = parseRequiredString(formData, 'startDate', 'Start date', fieldErrors);
  const endDate = parseRequiredString(formData, 'endDate', 'End date', fieldErrors);
  const description = parseOptionalString(formData, 'description');

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    fieldErrors.startDate = 'Start date must be valid';
  }

  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    fieldErrors.endDate = 'End date must be valid';
  }

  if (startDate && endDate && !fieldErrors.startDate && !fieldErrors.endDate) {
    if (new Date(startDate) > new Date(endDate)) {
      fieldErrors.endDate = 'End date must be on or after start date';
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !name || budget === null || !startDate || !endDate) {
    return { fieldErrors };
  }

  return {
    data: {
      name,
      description,
      budget,
      startDate,
      endDate,
    },
  };
}

export async function createCampaign(
  _prevState: any,
  formData: FormData,
): Promise<SponsorActionState> {
  const validation = validateCampaignForm(formData);
  if ('fieldErrors' in validation) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validation.data),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: await parseError(response) };
    }

    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create campaign',
    };
  }
}

export async function updateCampaign(
  _prevState: any,
  formData: FormData,
): Promise<SponsorActionState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.trim() === '') {
    return { error: 'Campaign id is required' };
  }

  const validation = validateCampaignForm(formData);
  if ('fieldErrors' in validation) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validation.data),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: await parseError(response) };
    }

    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update campaign',
    };
  }
}

export async function deleteCampaign(
  _prevState: any,
  formData: FormData,
): Promise<SponsorActionState> {
  const id = formData.get('id');
  if (typeof id !== 'string' || id.trim() === '') {
    return { error: 'Campaign id is required' };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/campaigns/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: await parseError(response) };
    }

    revalidatePath('/dashboard/sponsor');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete campaign',
    };
  }
}
