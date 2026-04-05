// Simple API client
// FIXME: This client has no error response parsing - when API returns { error: "..." },
// we should extract and throw that message instead of generic "API request failed"

// TODO: Add authentication token to requests
// Hint: Include credentials: 'include' for cookie-based auth, or
// add Authorization header for token-based auth

import type { AdSlot, Campaign, Placement } from '@/lib/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

type JsonObject = Record<string, unknown>;

export interface CreateCampaignInput {
  name: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  sponsorId: string;
}

export interface CreateAdSlotInput {
  name: string;
  description?: string;
  type: AdSlot['type'];
  basePrice: number;
  publisherId: string;
  width?: number;
  height?: number;
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
  if (!res.ok) throw new Error('API request failed');
  return res.json();
}

// Campaigns
export const getCampaigns = (sponsorId?: string, init?: RequestInit) =>
  api<Campaign[]>(sponsorId ? `/api/campaigns?sponsorId=${sponsorId}` : '/api/campaigns', init);
export const getCampaign = (id: string) => api<Campaign>(`/api/campaigns/${id}`);
export const createCampaign = (data: CreateCampaignInput) =>
  api('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });
// TODO: Add updateCampaign and deleteCampaign functions

// Ad Slots
export const getAdSlots = (publisherId?: string) =>
  api<AdSlot[]>(publisherId ? `/api/ad-slots?publisherId=${publisherId}` : '/api/ad-slots');
export const getAdSlot = (id: string) => api<AdSlot>(`/api/ad-slots/${id}`);
export const createAdSlot = (data: CreateAdSlotInput) =>
  api('/api/ad-slots', { method: 'POST', body: JSON.stringify(data) });
// TODO: Add updateAdSlot, deleteAdSlot functions

// Placements
export const getPlacements = () => api<Placement[]>('/api/placements');
export const createPlacement = (data: CreatePlacementInput) =>
  api('/api/placements', { method: 'POST', body: JSON.stringify(data) });

// Dashboard
export const getStats = () => api<JsonObject>('/api/dashboard/stats');
