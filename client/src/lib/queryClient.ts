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

// Import direct API call function
import { directApiCall } from './api-proxy';

export async function apiRequest<T = any>({
  url,
  method,
  data,
  headers = {},
}: ApiRequestOptions): Promise<T> {
  console.log(`Making API request to ${url} with method ${method}`);

  try {
    // Try the direct API call first
    // This will bypass the Vite middleware
    return await directApiCall<T>({
      path: url.startsWith('/') ? url.substring(1) : url,
      method,
      data,
      headers
    });
  } catch (error) {
    console.error('Direct API call failed, trying standard API request:', error);
    
    // Get auth token from localStorage if available
    const userStr = localStorage.getItem('user');
    let authHeaders: Record<string, string> = { 
      ...headers,
      // Add Accept header to explicitly request JSON responses
      'Accept': 'application/json'
    };
    
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
    
    console.log('Request headers:', authHeaders);
    
    // Fallback to regular fetch
    const res = await fetch(url, {
      method,
      headers: authHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
  
  // Check if we got HTML instead of JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    console.error('Received HTML response instead of JSON. API route handling issue detected.');
    const htmlContent = await res.text();
    console.error('HTML response preview:', htmlContent.substring(0, 100) + '...');
    
    // Throw a more helpful error
    throw new Error(
      'Server returned HTML instead of JSON. This is likely a routing issue. ' +
      'Please contact the development team.'
    );
  }

  await throwIfResNotOk(res);
  
  // Return parsed JSON for all but 204 No Content responses
  if (res.status === 204) {
    return {} as T;
  }
  
  const jsonResponse = await res.json() as T;
  console.log('API response:', jsonResponse);
  return jsonResponse;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    console.log(`Making query to ${queryKey[0]}`);
    
    try {
      // Use the direct API call first
      const path = (queryKey[0] as string).startsWith('/') 
        ? (queryKey[0] as string).substring(1) 
        : queryKey[0] as string;
        
      // Get auth token from localStorage
      const userStr = localStorage.getItem('user');
      let headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData.token) {
            headers['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (e) {
          console.error('Failed to parse user data from localStorage');
        }
      }
      
      // Use direct API call to bypass Vite
      return await directApiCall<T>({
        path,
        method: 'GET',
        headers
      });
    } catch (error) {
      console.error(`Direct API call for query ${queryKey[0]} failed:`, error);
      
      // Fallback to standard fetch
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          'Accept': 'application/json'
        } as Record<string, string>
      });
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as unknown as T;
      }
  
      // Check if we got HTML instead of JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON in query. API route handling issue detected.');
        const htmlContent = await res.text();
        console.error('HTML response preview:', htmlContent.substring(0, 100) + '...');
        
        // Throw a more helpful error
        throw new Error(
          'Server returned HTML instead of JSON. This is likely a routing issue. ' +
          'Please contact the development team.'
        );
      }
      
      await throwIfResNotOk(res);
      const jsonResponse = await res.json();
      console.log('Query response:', jsonResponse);
      return jsonResponse as T;
    }
  };
}

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
    }
  }
});
