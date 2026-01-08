"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toastUtils } from "@/lib/toast-utils";
import { useUpdateMcpServerMutation } from "@/queries/aiToolQuery";
import type { McpServer } from "@/types/ai";
import { CommonMcpServerForm } from "./common-mcp-server-form";
import { encryptWithPublicKey } from "@/lib/encrypt";
import truncateMiddleUrl from "@/lib/utils";

interface EditProps {
  server: McpServer;
  isOpen: boolean;
  onClose: () => void;
}

export function McpServerEdit({ server, isOpen, onClose }: EditProps) {
  const updateMutation = useUpdateMcpServerMutation();

  const onSubmit = async (data: any) => {
    const publicKeyPem = process.env.NEXT_PUBLIC_ENCRYPT_KEY;

    const authentication: Record<string, string> = {};

    for (const entry of data.authentication ?? []) {
      if (!entry?.key?.trim()) continue;

      const key = entry.key.trim();
      const value = String(entry.value ?? "").trim();

      authentication[key] = entry.isEncrypted
        ? value
        : await encryptWithPublicKey(publicKeyPem!, value);
    }

    try {
      await updateMutation.mutateAsync({
        serverId: server.id,
        ...data,
        authentication, // 🔐 encrypted-only payload
      });

      onClose();
      toastUtils.generic.success("Server updated successfully");
    } catch (err) {
      toastUtils.generic.error("Failed to update server");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit MCP Server</DialogTitle>
          <DialogDescription>Update server details</DialogDescription>
        </DialogHeader>

        <CommonMcpServerForm
          onSubmit={onSubmit}
          isEdit
          onCancel={onClose}
          defaultValues={{
            name: server.name,
            url: truncateMiddleUrl(server.url),
            sectorName: server.sectorName,

            authentication: server.authentication
              ? Object.entries(server.authentication).map(([key, value]) => ({
                  key,
                  value: String(value),
                  show: false,
                  isEncrypted: true, // ✅ UI-only flag
                }))
              : [],
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
