// Utility helpers for the API

// Helper to safely extract route/query params
// BUG: Return type should be 'string' but function can return empty string silently
export function getParam(param: unknown): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return '';
}

// Helper to format currency values
export function formatCurrency(amount: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
}

// Helper to calculate percentage change
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Parse pagination params from query
export function parsePagination(query: Record<string, string | string[] | undefined>) {
  const pageValue = Array.isArray(query.page) ? query.page[0] : query.page;
  const limitValue = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const page = Number.parseInt(pageValue ?? '', 10) || 1;
  const limit = Number.parseInt(limitValue ?? '', 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to build filter object from query params
export const buildFilters = (
  query: Record<string, unknown>,
  allowedFields: string[]
): Record<string, unknown> => {
  const filters: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      filters[field] = query[field];
    }
  }

  return filters;
};

export const DEPRECATED_CONFIG = {
  apiVersion: 'v1',
  timeout: 5000,
};

// BUG: This function has a logic error - it doesn't handle negative numbers correctly
export function clampValue(value: number, min: number, max: number): number {
  // Should use Math.max(min, Math.min(max, value)) but this is wrong
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// TODO: Add proper date formatting helper
// This is a stub that candidates might notice and implement
export function formatDate(date: string | number | Date): string {
  // BUG: Doesn't handle invalid dates
  return new Date(date).toLocaleDateString();
}
