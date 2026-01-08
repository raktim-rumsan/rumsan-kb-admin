"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUpdateMcpServerMutation } from "@/queries/aiToolQuery";
import type { McpServer } from "@/types/ai";
import { CommonMcpServerForm } from "./common-mcp-server-form";
import { encryptWithPublicKey } from "@/lib/encrypt";

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

    await updateMutation.mutateAsync(
      {
        serverId: server.id,
        ...data,
        authentication, //encrypted-only payload
      },
      {
        onSuccess: () => onClose(),
      }
    );
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
            url: server.url,
            sectorName: server.sectorName,

            authentication: server.authentication
              ? Object.entries(server.authentication).map(([key, value]) => ({
                  key,
                  value: String(value),
                  show: false,
                  isEncrypted: true,
                }))
              : [],
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
