// Frontend utility functions

// Format a price for display
// FIXME: 'price' has implicit 'any' type - should be 'number'
// BUG: unusedFormatter is declared but never used
export function formatPrice(price: any, locale = 'en-US') {
  const unusedFormatter = new Intl.NumberFormat(locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Debounce function for search inputs
// FIXME: Multiple 'any' types - fn should be typed, return type should be specified
export function debounce(fn: any, delay: number) {
  let timeoutId: any;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Parse query string parameters
// FIXME: Return type uses 'any' - should be Record<string, string>
export function parseQueryString(queryString: string): Record<string, any> {
  const params: any = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

// Check if we're running on the client side
export const isClient = typeof window !== 'undefined';

// Truncate text with ellipsis
// BUG: unusedCheck is declared but never used
export function truncate(text: string, maxLength: number): string {
  const unusedCheck = text.length > maxLength;
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Class name helper (simple cn alternative)
// FIXME: 'classes' should be typed more strictly
export function cn(...classes: any[]): string {
  return classes.filter(Boolean).join(' ');
}

// Sleep utility for testing/debugging
// BUG: Missing return type annotation
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Deep clone an object
// NOTE: This doesn't handle circular references, dates, or functions
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Logger that only logs in development
// FIXME: Logger methods use 'any' - should be typed as 'unknown'
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[App]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[App Error]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[App Warning]', ...args);
  },
};

// TODO: Add a proper date formatting utility
// BUG: Doesn't handle timezone or invalid dates
export function formatRelativeTime(date: any): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}
