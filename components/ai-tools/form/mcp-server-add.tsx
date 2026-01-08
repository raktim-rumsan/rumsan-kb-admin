"use client";

import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toastUtils } from "@/lib/toast-utils";
import { useCreateMcpServerMutation } from "@/queries/aiToolQuery";
import { CommonMcpServerForm } from "./common-mcp-server-form";

export function McpServerAdd({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const createMutation = useCreateMcpServerMutation();

  const onSubmit = async (data: any) => {
    const authentication = (data.authentication ?? []).reduce(
      (acc: Record<string, string>, entry: any) => {
        if (entry && entry.key?.trim())
          acc[entry.key.trim()] = (entry.value ?? "").toString().trim();
        return acc;
      },
      {}
    );

    const payload = { ...data, authentication };

    await createMutation.mutateAsync(payload, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Create a new MCP server connection
          </DialogDescription>
        </DialogHeader>
        <CommonMcpServerForm
          onSubmit={onSubmit}
          defaultValues={{
            name: "",
            url: "",
            sectorName: "",
            authentication: [],
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
