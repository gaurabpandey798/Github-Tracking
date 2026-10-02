export class ApiClientError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085';
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_API_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_API_PASSWORD || 'admin123';

const AUTH_STORAGE_KEY = 'ideax_auth_credentials';

export function getStoredCredentials(): { username: string; token: string } {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.token) {
          return parsed;
        }
      }
    } catch {
      // fallback to env defaults
    }
  }
  const token = typeof window !== 'undefined'
    ? btoa(`${DEFAULT_USERNAME}:${DEFAULT_PASSWORD}`)
    : Buffer.from(`${DEFAULT_USERNAME}:${DEFAULT_PASSWORD}`).toString('base64');
  return { username: DEFAULT_USERNAME, token };
}

export function setStoredCredentials(username: string, token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username, token }));
  }
}

export function clearStoredCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Resolves the base URL.
 * When in the browser, if calling http://localhost:8085 directly would hit CORS restrictions,
 * we route via Next.js proxy route /api/proxy which forwards directly to http://localhost:8085.
 */
function resolveEndpoint(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (typeof window !== 'undefined') {
    // In browser: use Next.js proxy to avoid CORS issues with the backend
    if (cleanPath.startsWith('/api/')) {
      return `/api/proxy${cleanPath.replace(/^\/api/, '')}`;
    }
    return `/api/proxy${cleanPath}`;
  }

  // Server-side (SSR / Node): use direct base URL
  const base = DEFAULT_BASE_URL.replace(/\/+$/, '');
  return `${base}${cleanPath}`;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = resolveEndpoint(endpoint);
  const { token } = getStoredCredentials();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Basic ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred.';
      let details: string | undefined;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          details = errorData.path ? `Endpoint: ${errorData.path}` : undefined;
        } else {
          const text = await response.text();
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }
      } catch {
        // failed to parse body, use standard status messages
      }

      switch (response.status) {
        case 401:
          throw new ApiClientError(
            401,
            'Authentication failed. Invalid or expired admin credentials.',
            details
          );
        case 403:
          throw new ApiClientError(
            403,
            'Access denied. You do not have permission for this action.',
            details
          );
        case 404:
          throw new ApiClientError(
            404,
            errorMessage !== 'An unexpected error occurred.'
              ? errorMessage
              : 'The requested resource was not found.',
            details
          );
        case 500:
          throw new ApiClientError(
            500,
            errorMessage !== 'An unexpected error occurred.'
              ? errorMessage
              : 'Backend server encountered an error processing your request.',
            details
          );
        case 502:
        case 503:
        case 504:
          throw new ApiClientError(
            response.status,
            'Backend service is unavailable. Please verify the backend is running on port 8085.',
            details
          );
        default:
          throw new ApiClientError(response.status, errorMessage, details);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    const err = error as Error;
    // Network failure / connection refused
    throw new ApiClientError(
      0,
      `Network connection failed. Unable to communicate with IdeaX backend at ${DEFAULT_BASE_URL}.`,
      err?.message
    );
  }
}
