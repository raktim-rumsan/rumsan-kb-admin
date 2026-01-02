









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
import { useCreateMcpServerMutation, useUpdateMcpServerMutation } from "@/queries/aiToolQuery";
import { toastUtils } from "@/lib/toast-utils";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useMcpServerBySectorQuery } from "@/queries/aiToolQuery";

type AuthEntry = { key: string; value: string; show?: boolean };

type FormValues = {
  name: string;
  url: string;
  sectorName: string;
  authentication: AuthEntry[];
};

type CreateMcpServerModalProps = {
  isOpen: boolean;
  initialData?: any; // optional prefill data
  sectorName?: string; // can keep if needed
  disableSector?: boolean;
  loading?: boolean; // optional loading state
  onClose: () => void;
  onSaveSuccess?: () => void;
};

export function CreateMcpServerModal({
  isOpen,
  sectorName,
  onClose,
  onSaveSuccess,
  disableSector = false,
}: CreateMcpServerModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // 1️⃣ Fetch MCP server by sector using your existing query
  const { data: serverData } = useMcpServerBySectorQuery(sectorName);

  // 2️⃣ React Hook Form
  const { register, control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: serverData?.name ?? "",
      url: serverData?.url ?? "",
      sectorName: serverData?.sectorName ?? "",
      authentication: serverData
        ? Object.entries(serverData.authentication || {}).map(([key, value]) => ({
            key,
            value: String(value),
            show: false,
          }))
        : [{ key: "", value: "", show: false }],
    },
  });

  // 3️⃣ Reset form immediately if serverData changes (no useEffect)
  if (serverData) {
    reset({
      name: serverData.name,
      url: serverData.url,
      sectorName: serverData.sectorName,
      authentication:
        Object.entries(serverData.authentication || {}).map(([key, value]) => ({
          key,
          value: String(value),
          show: false,
        })) || [{ key: "", value: "", show: false }],
    });
  }

  // 4️⃣ Dynamic auth entries
  const { fields, append, remove } = useFieldArray({ control, name: "authentication" });
  const authWatch = watch("authentication");

  // 5️⃣ Mutations
  const createMcpServer = useCreateMcpServerMutation(() => {
    reset();
    onClose();
  });
  const updateMcpServer = useUpdateMcpServerMutation();

  // 6️⃣ Submit handler
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);

    const authentication = data.authentication.reduce<Record<string, string>>((acc, entry) => {
      if (entry.key.trim()) acc[entry.key.trim()] = entry.value.trim();
      return acc;
    }, {});

    const payload = {
      name: data.name.trim(),
      url: data.url.trim(),
      sectorName: data.sectorName,
      authentication,
    };

    try {
      if (sectorName) {
        await updateMcpServer.mutateAsync(payload);
        toastUtils.generic.success("MCP server updated");
      } else {
        await createMcpServer.mutateAsync(payload);
        toastUtils.generic.success("MCP server created");
      }
      onSaveSuccess?.();
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save MCP server";
      toastUtils.generic.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{sectorName ? "Edit" : "Add New"} Server</DialogTitle>
          <DialogDescription>
            {sectorName
              ? "Update the MCP server details. All fields marked with * are required."
              : "Configure a new MCP server connection. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="server-name">Name *</Label>
            <Input id="server-name" {...register("name", { required: true })} />
          </div>

          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="server-url">URL *</Label>
            <Input id="server-url" {...register("url", { required: true })} />
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label htmlFor="sector">Sector Name</Label>
            <Controller
              control={control}
              name="sectorName"
              render={({ field }) => (
                <Select {...field} disabled={disableSector || Boolean(sectorName)}>
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
              )}
            />
            {(disableSector || sectorName) && (
              <p className="text-xs text-muted-foreground mt-1">
                Sector cannot be changed while editing.
              </p>
            )}
          </div>

          {/* Authentication */}
          <div className="grid gap-2">
            <div className="flex items-start justify-between">
              <div>
                <Label htmlFor="authentication">Authentication *</Label>
                <p className="text-sm text-muted-foreground">Add authentication for the MCP server</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">JSON</Button>
                <Button variant="outline" size="sm" type="button" onClick={() => append({ key: "", value: "", show: false })}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-3 border rounded-lg relative">
                  <div className="grid gap-2">
                    <Input
                      placeholder="key (e.g., mcp-authentication)"
                      {...register(`authentication.${idx}.key` as const, { required: true })}
                    />
                    <div className="relative">
                      <Input
                        placeholder="value"
                        type={authWatch[idx]?.show ? "text" : "password"}
                        {...register(`authentication.${idx}.value` as const, { required: true })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-10 top-2 h-8 w-8 p-0"
                        onClick={() => setValue(`authentication.${idx}.show`, !authWatch[idx]?.show)}
                      >
                        {authWatch[idx]?.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive"
                        onClick={() => remove(idx)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : sectorName ? "Save changes" : "Create Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






