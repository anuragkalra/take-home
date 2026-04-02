'use client';

import { useEffect, useState } from 'react';
import { getCampaigns } from '@/lib/api';
import { authClient } from '@/auth-client';
import { CampaignCard } from './campaign-card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

// FIXME: This component fetches data client-side - should use Server Components
// See Challenge 2 in CHALLENGES.md for proper implementation
export function CampaignList() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  // TODO: Add refetch on tab focus for better UX
  // TODO: Add optimistic updates when creating/editing campaigns
  useEffect(() => {
    async function loadCampaigns() {
      if (!session?.user?.id) return;

      try {
        // Get the user's sponsorId from the backend
        const roleRes = await fetch(`${API_URL}/api/auth/role/${session.user.id}`);
        const roleData = await roleRes.json();

        if (roleData.sponsorId) {
          const data = await getCampaigns(roleData.sponsorId);
          setCampaigns(data);
        } else {
          setCampaigns([]);
        }
      } catch {
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, [session?.user?.id]);

  if (loading) {
    return <div className="py-8 text-center text-[--color-muted]">Loading campaigns...</div>;
  }

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
        No campaigns yet. Create your first campaign to get started.
      </div>
    );
  }

  // TODO: Add sorting options (by date, budget, status)
  // TODO: Add pagination if campaigns list gets large
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
