"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SECTORS } from "@/constants/sector";
import { useCreateMcpServerMutation } from "@/queries/aiToolQuery";

interface CreateMcpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: () => void;
}

export function CreateMcpServerModal({ isOpen, onClose, onCreateSuccess }: CreateMcpServerModalProps) {
  const [serverName, setServerName] = useState("");
  const [url, setUrl] = useState("");
  const [sector, setSector] = useState("");
  // track multiple auth entries (key/value/show)
  const [authEntries, setAuthEntries] = useState([
    { key: "mcp-authentication", value: "", show: false },
  ]);

  const createMcpServer = useCreateMcpServerMutation(() => {
    setServerName("");
    setUrl("");
    setSector("");
    setAuthEntries([{ key: "mcp-authentication", value: "", show: false }]);
    onClose();
  });

  const handleCreateServer = () => {
    // validate required fields
    if (
      !serverName.trim() ||
      !url.trim() ||
      !sector ||
      !authEntries.every((e) => e.key.trim() && e.value.trim())
    )
      return;

    const mcpAuthToken = authEntries.reduce<Record<string, string>>((acc, e) => {
      acc[e.key.trim()] = e.value.trim();
      return acc;
    }, {});

    const payload = {
      name: serverName.trim(),
      url: url.trim(),
      sectorName: sector,
      mcpAuthToken,
    };
    console.log("Creating MCP server with payload:", payload);

    createMcpServer.mutate(payload, {
      onSuccess: () => {
        onCreateSuccess();
      },
    });
  };

  const addAuthEntry = () =>
    setAuthEntries((prev) => [...prev, { key: "", value: "", show: false }]);

  const removeAuthEntry = (idx: number) =>
    setAuthEntries((prev) => prev.filter((_, i) => i !== idx));

  const updateAuthEntry = (idx: number, patch: Partial<{ key: string; value: string; show: boolean }>) =>
    setAuthEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const isFormValid =
    serverName.trim() && url.trim() && sector && authEntries.every((e) => e.key.trim() && e.value.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
          <DialogDescription>
            Configure a new MCP server connection. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="server-name">Name *</Label>
            <Input
              id="server-name"
              placeholder="e.g., Banking Server"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="server-url">URL *</Label>
            <Input
              id="server-url"
              placeholder="http://localhost:3000/mcp"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sector">Sector Name</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger id="sector" className="h-12 w-full">
                <SelectValue placeholder="Select Sector" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-start justify-between">
              <div>
                <Label htmlFor="authentication">Authentication *</Label>
                <p className="text-sm text-muted-foreground">Add authentication for the MCP server</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">JSON</Button>
                <Button variant="outline" size="sm" onClick={addAuthEntry}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {authEntries.map((entry, idx) => (
                <div key={idx} className="p-3 border rounded-lg relative">
                  <div className="grid gap-2">
                    <Input
                      placeholder="key (e.g., mcp-authentication)"
                      value={entry.key}
                      onChange={(e) => updateAuthEntry(idx, { key: e.target.value })}
                    />
                    <div className="relative">
                      <Input
                        placeholder="value"
                        type={entry.show ? "text" : "password"}
                        value={entry.value}
                        onChange={(e) => updateAuthEntry(idx, { value: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-10 top-2 h-8 w-8 p-0"
                        onClick={() => updateAuthEntry(idx, { show: !entry.show })}
                      >
                        {entry.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive"
                        onClick={() => removeAuthEntry(idx)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateServer}
            disabled={!isFormValid}
          >
            Create Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
