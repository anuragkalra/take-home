'use client';

import { useEffect, useState } from 'react';
import { getAdSlots } from '@/lib/api';
import { authClient } from '@/auth-client';
import { AdSlotCard } from './ad-slot-card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export function AdSlotList() {
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    async function loadAdSlots() {
      if (!session?.user?.id) return;

      try {
        // Get the user's publisherId from the backend
        const roleRes = await fetch(`${API_URL}/api/auth/role/${session.user.id}`);
        const roleData = await roleRes.json();

        if (roleData.publisherId) {
          const data = await getAdSlots(roleData.publisherId);
          setAdSlots(data);
        } else {
          setAdSlots([]);
        }
      } catch {
        setError('Failed to load ad slots');
      } finally {
        setLoading(false);
      }
    }

    loadAdSlots();
  }, [session?.user?.id]);

  if (loading) {
    return <div className="py-8 text-center text-[--color-muted]">Loading ad slots...</div>;
  }

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (adSlots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
        No ad slots yet. Create your first ad slot to start earning.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adSlots.map((slot) => (
        <AdSlotCard key={slot.id} adSlot={slot} />
      ))}
    </div>
  );
}
