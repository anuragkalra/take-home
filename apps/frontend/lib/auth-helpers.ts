const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export type UserRole = 'sponsor' | 'publisher' | null;

export interface RoleData {
  role: UserRole;
  sponsorId?: string;
  publisherId?: string;
  name?: string;
}

/**
 * Fetch user role from the backend based on userId.
 * Returns role info including sponsorId/publisherId if applicable.
 */
export async function getUserRole(userId: string): Promise<RoleData> {
  try {
    const res = await fetch(`${API_URL}/api/auth/role/${userId}`, {
      cache: 'no-store', // Always fetch fresh role data
    });
    if (!res.ok) {
      return { role: null };
    }
    return await res.json();
  } catch {
    return { role: null };
  }
}
