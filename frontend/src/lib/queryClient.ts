import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clear invalid tokens only on 401 (unauthorized), not 403 (forbidden)
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  const isFormData = data instanceof FormData;

  // Let the browser set the multipart Content-Type (with boundary) itself for FormData.
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Use backend URL for API requests
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use backend URL for API requests
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      localStorage.removeItem('auth_token');
      return null;
    }
    if (unauthorizedBehavior === "returnNull" && res.status === 403) {
      // 403 means authenticated but insufficient permissions - don't clear token
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
