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

interface Props {
  server: McpServer;
  isOpen: boolean;
  onClose: () => void;
}

export function McpServerEdit({ server, isOpen, onClose }: Props) {
  const updateMutation = useUpdateMcpServerMutation();

  const onSubmit = async (data: any) => {
    const authentication = (data.authentication ?? []).reduce(
      (acc: Record<string, string>, entry: any) => {
        if (entry && entry.key?.trim())
          acc[entry.key.trim()] = (entry.value ?? "").toString().trim();
        return acc;
      },
      {}
    );

    await updateMutation.mutateAsync({
      serverId: server.id,
      ...data,
      authentication,
    });
    onClose();
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
          defaultValues={{
            name: server.name,
            url: server.url,
            sectorName: server.sectorName,
            authentication: Array.isArray(server.authentication)
              ? server.authentication.map((e: any) => ({
                  key: e?.key ?? String(e?.key ?? ""),
                  value: String(e?.value ?? ""),
                  show: false,
                }))
              : server.authentication
              ? Object.entries(server.authentication).map(([k, v]) => ({
                  key: k,
                  value: String(v),
                  show: false,
                }))
              : [],
          }}
          isEdit
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
