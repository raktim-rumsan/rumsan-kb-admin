import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";

import API_BASE_URL from "@/constants";


export function useDocUploadMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: File | FormData | { file: File; industry?: string },
    ) => {
      const access_token = getAuthToken();

      // Build FormData
      let formData: FormData;
      let industry: string | undefined;

      if (payload instanceof FormData) {
        formData = payload;
        // Try to read industry from FormData if present
        const industryValue = formData.get('industry');
        if (typeof industryValue === 'string') industry = industryValue;
      } else if (payload instanceof File) {
        formData = new FormData();
        formData.append('file', payload);
      } else {
        formData = new FormData();
        formData.append('file', payload.file);
        if (payload.industry) {
          formData.append('industry', payload.industry);
          industry = payload.industry;
        }
      }

      // Build headers, only add x-industry if defined
      const headers: Record<string, string> = {};
      if (access_token) headers['access_token'] = access_token;
      if (industry) headers['x-industry'] = industry;

      const res = await fetch(`${API_BASE_URL}/admin/docs/upload`, {
        method: 'POST',
        body: formData,
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
       const errorMessage = data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onSuccess?.();
    },
  });
}

export function useDocsQuery() {

  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/docs`, {
        method: "GET",
        headers: {
          access_token: access_token || "",
          accept: "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        // Handle API error responses properly
        const errorMessage = data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      return data;
    },
  });
}

export function useDocDeleteMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/docs/${documentId}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Handle API error responses properly
        const errorMessage =
          errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      // Return success response (might be empty for DELETE)
      const data = await res.json().catch(() => ({ success: true }));
      return data;
    },
    onSuccess: () => {
      // Invalidate documents query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
    },
  });
}

export function useEmbeddingMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/embeddings`, {
        method: "POST",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // API returns error message in 'message' field
        const errorMessage =
          errorData.message || errorData.error || `Failed to train document (${res.status})`;
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate documents query to refetch the list and update status
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
    },
  });
}

export function useUnembeddingMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/embeddings/unembed`, {
        method: "POST",
        headers: {
          accept: "application/json",
          access_token: access_token || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: documentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // API returns error message in 'message' field
        const errorMessage =
          errorData.message || errorData.error || `Failed to train document (${res.status})`;
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate documents query to refetch the list and update status
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
    },
  });
}

export async function viewDocument(url: string, setPreviewUrl: (url: string | null) => void) {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_API!;
  const accessToken = getAuthToken();
  const fileUrl = `${serverUrl}/${url.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = { accept: "application/pdf" };
  if (accessToken) headers["access_token"] = accessToken;

  const response = await fetch(fileUrl, { headers });
  if (!response.ok) {
    try {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    } catch {
      // If response is not JSON, fall back to response text
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
    }
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  setPreviewUrl(blobUrl);
}
