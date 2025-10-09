import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { useTenant } from "@/stores/tenantStore";

import API_BASE_URL from "@/constants";

export function useOrgMembersQuery() {
  const tenantId = useTenant();
  return useQuery({
    queryKey: ["members", tenantId],
    queryFn: async () => {
      const access_token = getAuthToken();
      const tenantId = localStorage.getItem("tenantId");
      const res = await fetch(`${API_BASE_URL}/orgs/members`, {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-tenant-id": tenantId || "",
          access_token: access_token || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch members");
      return data;
    },
  });
}

export function useAddOrgUserMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const access_token = getAuthToken();
      const tenantId = localStorage.getItem("tenantId");
      const res = await fetch(`${API_BASE_URL}/orgs/users`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-tenant-id": tenantId || "",
          access_token: access_token || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      onSuccess?.();
    },
  });
}
