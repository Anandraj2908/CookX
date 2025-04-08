import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  url: string;
  method: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>({
  url,
  method,
  data,
  headers = {},
}: ApiRequestOptions): Promise<T> {
  // Get auth token from localStorage if available
  const userStr = localStorage.getItem('user');
  let authHeaders = { ...headers };
  
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      if (userData.token) {
        authHeaders = {
          ...authHeaders,
          'Authorization': `Bearer ${userData.token}`
        };
      }
    } catch (e) {
      console.error('Failed to parse user data from localStorage');
    }
  }
  
  // Set content type for JSON data
  if (data) {
    authHeaders = {
      ...authHeaders,
      'Content-Type': 'application/json'
    };
  }
  
  const res = await fetch(url, {
    method,
    headers: authHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  await throwIfResNotOk(res);
  
  // Return parsed JSON for all but 204 No Content responses
  if (res.status === 204) {
    return {} as T;
  }
  
  return await res.json() as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
