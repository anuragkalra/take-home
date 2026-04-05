'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export type PublisherActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;

async function getSessionCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (!cookieHeader) {
    throw new Error('You must be logged in to manage ad slots');
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

function parseBasePrice(
  formData: FormData,
  fieldErrors: Record<string, string>,
) {
  const value = formData.get('basePrice');

  if (typeof value !== 'string' || value.trim() === '') {
    fieldErrors.basePrice = 'Price is required';
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    fieldErrors.basePrice = 'Price must be a valid number greater than or equal to 0';
    return null;
  }

  return parsed;
}

function validateAdSlotForm(formData: FormData) {
  const fieldErrors: Record<string, string> = {};
  const name = parseRequiredString(formData, 'name', 'Name', fieldErrors);
  const type = parseRequiredString(formData, 'type', 'Type', fieldErrors);
  const basePrice = parseBasePrice(formData, fieldErrors);
  const description = parseOptionalString(formData, 'description');
  const position = parseOptionalString(formData, 'position');

  if (type && !AD_SLOT_TYPES.includes(type as (typeof AD_SLOT_TYPES)[number])) {
    fieldErrors.type = 'Type is invalid';
  }

  if (Object.keys(fieldErrors).length > 0 || !name || !type || basePrice === null) {
    return { fieldErrors };
  }

  return {
    data: {
      name,
      description,
      type,
      basePrice,
      position,
    },
  };
}

export async function createAdSlot(
  _prevState: any,
  formData: FormData,
): Promise<PublisherActionState> {
  const validation = validateAdSlotForm(formData);
  if ('fieldErrors' in validation) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/ad-slots`, {
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

    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create ad slot',
    };
  }
}

export async function updateAdSlot(
  _prevState: any,
  formData: FormData,
): Promise<PublisherActionState> {
  const id = parseRequiredString(formData, 'id', 'Ad slot', {});
  if (!id) {
    return { error: 'Ad slot id is required' };
  }

  const validation = validateAdSlotForm(formData);
  if ('fieldErrors' in validation) {
    return { fieldErrors: validation.fieldErrors };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/ad-slots/${id}`, {
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

    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update ad slot',
    };
  }
}

export async function deleteAdSlot(
  _prevState: any,
  formData: FormData,
): Promise<PublisherActionState> {
  const id = formData.get('id');

  if (typeof id !== 'string' || id.trim() === '') {
    return { error: 'Ad slot id is required' };
  }

  try {
    const cookieHeader = await getSessionCookieHeader();
    const response = await fetch(`${API_URL}/api/ad-slots/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: await parseError(response) };
    }

    revalidatePath('/dashboard/publisher');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete ad slot',
    };
  }
}
