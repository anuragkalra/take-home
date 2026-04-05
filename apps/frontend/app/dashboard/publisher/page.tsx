import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { API_URL } from '@/lib/api';
import { getUserRole } from '@/lib/auth-helpers';
import type { AdSlot } from '@/lib/types';
import { PublisherDashboardClient } from './components/publisher-dashboard-client';

export default async function PublisherDashboard() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'publisher' role
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'publisher') {
    redirect('/');
  }

  const cookieHeader = requestHeaders.get('cookie') ?? '';
  const response = await fetch(`${API_URL}/api/ad-slots`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });

  if (!response.ok) {
    throw new Error('Failed to load ad slots');
  }

  const adSlots = (await response.json()) as AdSlot[];

  return <PublisherDashboardClient adSlots={adSlots} />;
}
