import type { AdSlot, Campaign, Placement } from '@/lib/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

type JsonObject = Record<string, unknown>;

export interface CreateCampaignInput {
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  cpmRate?: number | null;
  cpcRate?: number | null;
  targetCategories?: string[];
  targetRegions?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string | null;
  budget?: number;
  startDate?: string;
  endDate?: string;
  cpmRate?: number | null;
  cpcRate?: number | null;
  status?: Campaign['status'];
  targetCategories?: string[];
  targetRegions?: string[];
}

export interface CreateAdSlotInput {
  name: string;
  description?: string;
  type: AdSlot['type'];
  basePrice: number;
  position?: string | null;
  width?: number;
  height?: number;
  cpmFloor?: number | null;
  isAvailable?: boolean;
}

export interface UpdateAdSlotInput {
  name?: string;
  description?: string | null;
  type?: AdSlot['type'];
  position?: string | null;
  width?: number | null;
  height?: number | null;
  basePrice?: number;
  cpmFloor?: number | null;
  isAvailable?: boolean;
}

export interface CreatePlacementInput {
  campaignId: string;
  adSlotId: string;
  sponsorId: string;
  publisherId: string;
  creativeId: string;
  agreedPrice: number;
  startDate: string;
  endDate: string;
}

export async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let message = 'API request failed';

    try {
      const errorBody = (await res.json()) as { error?: string };
      if (typeof errorBody.error === 'string' && errorBody.error.trim() !== '') {
        message = errorBody.error;
      }
    } catch {
      // Ignore non-JSON error bodies and fall back to the generic message.
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// Campaigns
export const getCampaigns = (init?: RequestInit) => api<Campaign[]>('/api/campaigns', init);
export const getCampaign = (id: string) => api<Campaign>(`/api/campaigns/${id}`);
export const createCampaign = (data: CreateCampaignInput) =>
  api('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });
export const updateCampaign = (id: string, data: UpdateCampaignInput) =>
  api<Campaign>(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCampaign = (id: string) =>
  api<void>(`/api/campaigns/${id}`, { method: 'DELETE' });

// Ad Slots
export const getAdSlots = () => api<AdSlot[]>('/api/ad-slots');
export const getAdSlot = (id: string) => api<AdSlot>(`/api/ad-slots/${id}`);
export const createAdSlot = (data: CreateAdSlotInput) =>
  api('/api/ad-slots', { method: 'POST', body: JSON.stringify(data) });
export const updateAdSlot = (id: string, data: UpdateAdSlotInput) =>
  api<AdSlot>(`/api/ad-slots/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAdSlot = (id: string) =>
  api<void>(`/api/ad-slots/${id}`, { method: 'DELETE' });

// Placements
export const getPlacements = () => api<Placement[]>('/api/placements');
export const createPlacement = (data: CreatePlacementInput) =>
  api('/api/placements', { method: 'POST', body: JSON.stringify(data) });

// Dashboard
export const getStats = () => api<JsonObject>('/api/dashboard/stats');
