import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { useTenantId } from "@/stores/tenantStore";

import API_BASE_URL from "@/constants";

export function useDocUploadMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const tenantId = localStorage.getItem("tenantId");
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/docs/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "x-tenant-id": tenantId || "",
          access_token: access_token || "",
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
    onSuccess: () => {
      // Invalidate documents query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSuccess?.();
    },
  });
}

export function useDocsQuery() {
  const tenantId = useTenantId();

  return useQuery({
    queryKey: ["documents", tenantId],
    queryFn: async () => {
      const tenantId = localStorage.getItem("tenantId");
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/docs`, {
        method: "GET",
        headers: {
          "x-tenant-id": tenantId || "",
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
      const tenantId = localStorage.getItem("tenantId");
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/docs/${documentId}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "x-tenant-id": tenantId || "",
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
      const tenantId = localStorage.getItem("tenantId");
      const access_token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/embeddings`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-tenant-id": tenantId || "",
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
  const tenantId = localStorage.getItem("tenantId");
  const fileUrl = `${serverUrl}/${url.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = { accept: "application/pdf" };
  if (accessToken) headers["access_token"] = accessToken;
  if (tenantId) headers["x-tenant-id"] = tenantId;

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
