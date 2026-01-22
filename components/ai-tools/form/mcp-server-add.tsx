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
import { useCreateMcpServerMutation } from "@/queries/aiToolQuery";
import { CommonMcpServerForm } from "./common-mcp-server-form";
import { encryptWithPublicKey } from "@/lib/encrypt";

export function McpServerAdd({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const createMutation = useCreateMcpServerMutation();

  const onSubmit = async (data: any) => {
    const publicKeyPem = process.env.NEXT_PUBLIC_ENCRYPT_KEY;

    // Encrypt each auth value
    const authentication: Record<string, string> = {};
    for (const entry of data.authentication ?? []) {
      if (entry?.key?.trim()) {
        const encryptedValue = await encryptWithPublicKey(
          publicKeyPem!,
          (entry.value ?? "").toString().trim()
        );
        authentication[entry.key.trim()] = encryptedValue;
      }
    }

    const payload = { ...data, authentication };

    createMutation.mutate(payload, {
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
            type: "",
            sectorName: "",
            authentication: [],
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
