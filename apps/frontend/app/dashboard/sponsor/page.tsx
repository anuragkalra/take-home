import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCampaigns } from '@/lib/api';
import { getUserRole } from '@/lib/auth-helpers';
import { SponsorDashboardClient } from './components/sponsor-dashboard-client';

export default async function SponsorDashboard() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'sponsor' role
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'sponsor') {
    redirect('/');
  }

  // Forward the session cookie so the backend can authenticate the server-side
  // fetch. The backend scopes campaigns to the caller's sponsorId via the session,
  // so no sponsorId query param is needed.
  const cookieHeader = requestHeaders.get('cookie') ?? '';
  const campaigns = await getCampaigns(undefined, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });

  return <SponsorDashboardClient campaigns={campaigns} />;
}
