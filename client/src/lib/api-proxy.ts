/**
 * API Proxy to handle routing issues with the Vite development server
 * 
 * This helper script can be used as a temporary workaround when the Vite server
 * is intercepting API routes and returning HTML instead of JSON.
 */

// Direct API base URL when bypassing Vite
export const API_BASE_URL = 'http://localhost:5000';

// Helper function to get the full API URL
export function getDirectApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

// Helper function for direct API calls
export async function directApiCall<T = any>(options: {
  path: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
}): Promise<T> {
  const { path, method, data, headers = {} } = options;
  
  console.log(`Making direct API call to ${path} with method ${method}`);
  
  // Get auth token from localStorage if available
  const userStr = localStorage.getItem('user');
  let requestHeaders: Record<string, string> = { 
    ...headers,
    'Accept': 'application/json' 
  };
  
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      if (userData.token) {
        requestHeaders = {
          ...requestHeaders,
          'Authorization': `Bearer ${userData.token}`
        };
      }
    } catch (e) {
      console.error('Failed to parse user data from localStorage');
    }
  }
  
  // Set content type for JSON data
  if (data) {
    requestHeaders = {
      ...requestHeaders,
      'Content-Type': 'application/json'
    };
  }
  
  console.log('Request headers:', requestHeaders);
  
  // Make the direct API call to the server
  const url = getDirectApiUrl(path);
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });
  
  // Check for HTML response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    console.error('Received HTML response from direct API call');
    throw new Error('API returned HTML instead of JSON. This is likely due to a server configuration issue.');
  }
  
  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error (${response.status}):`, errorText);
    throw new Error(errorText || response.statusText);
  }
  
  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  // Parse and return JSON response
  const result = await response.json() as T;
  console.log('API response:', result);
  return result;
}

// Login helper
export async function loginUser(email: string, password: string) {
  return directApiCall({
    path: 'api/auth/login',
    method: 'POST',
    data: { email, password }
  });
}

// Signup helper
export async function signupUser(username: string, email: string, password: string) {
  return directApiCall({
    path: 'api/auth/signup',
    method: 'POST',
    data: { username, email, password }
  });
}

// Get current user helper
export async function getCurrentUser() {
  return directApiCall({
    path: 'api/auth/me',
    method: 'GET'
  });
}

// Logout helper
export async function logoutUser() {
  return directApiCall({
    path: 'api/auth/logout',
    method: 'POST'
  });
}