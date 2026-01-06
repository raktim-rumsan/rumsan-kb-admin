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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SECTORS } from "@/constants/sector";
import {
  useCreateMcpServerMutation,
  useUpdateMcpServerMutation,
} from "@/queries/aiToolQuery";
import type {
  AuthEntry,
  FormValues,
  McpServer,
  CreateMcpServerPayload,
  UpdateMcpServerPayload,
} from "@/types/ai";
import { toastUtils } from "@/lib/toast-utils";

import { useForm, useFieldArray, Controller } from "react-hook-form";

type CreateMcpServerModalProps = {
  isOpen: boolean;
  initialData?: McpServer | null; // optional prefill data
  sectorName?: string; // can keep if needed
  disableSector?: boolean;
  loading?: boolean; // optional loading state
  onClose: () => void;
  onSaveSuccess?: () => void;
};

export function CreateMcpServerModal({
  isOpen,
  sectorName,
  initialData,
  onClose,
  onSaveSuccess,
  disableSector = false,
}: CreateMcpServerModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  // 2️⃣ React Hook Form — use `initialData` passed from parent (no internal query/reset)
  const { register, control, handleSubmit, reset, setValue, watch } =
    useForm<FormValues>({
      defaultValues: {
        name: initialData?.name ?? "",
        url: initialData?.url ?? "",
        sectorName: initialData?.sectorName ?? "",
        authentication: initialData
          ? Object.entries(initialData.authentication || {}).map(
              ([key, value]) => ({
                key,
                value: String(value),
                show: false,
              })
            )
          : [],
      },
    });

  // 4️⃣ Dynamic auth entries
  const { fields, append, remove } = useFieldArray({
    control,
    name: "authentication",
  });
  const authWatch = watch("authentication");

  const enterJsonMode = () => {
    const obj: Record<string, string> = {};
    (authWatch || []).forEach((entry) => {
      if (entry?.key?.trim()) obj[entry.key.trim()] = entry.value ?? "";
    });
    setJsonText(Object.keys(obj).length ? JSON.stringify(obj, null, 2) : "{}");
    setIsJsonMode(true);
  };

  const exitJsonMode = () => {
    try {
      const parsed = JSON.parse(jsonText || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid JSON object");
      }
      const arr: AuthEntry[] = Object.entries(parsed).map(([k, v]) => ({
        key: k,
        value: String(v ?? ""),
        show: false,
      }));
      setValue("authentication", arr);
      setIsJsonMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      toastUtils.generic.error(message);
    }
  };

  // 5️⃣ Mutations
  const createMcpServer = useCreateMcpServerMutation(() => {
    reset();
    onClose();
  });
  const updateMcpServer = useUpdateMcpServerMutation();

  // 6️⃣ Submit handler
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);

    let authentication: Record<string, string> = {};
    if (isJsonMode) {
      try {
        const parsed = JSON.parse(jsonText || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error("Invalid JSON");
        Object.entries(parsed).forEach(([k, v]) => {
          if (String(k).trim())
            authentication[String(k).trim()] = String(v ?? "").trim();
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid JSON";
        toastUtils.generic.error(message);
        setIsSaving(false);
        return;
      }
    } else {
      authentication = (data.authentication ?? []).reduce<
        Record<string, string>
      >((acc, entry) => {
        if (entry && entry.key && entry.key.trim())
          acc[entry.key.trim()] = (entry.value ?? "").trim();
        return acc;
      }, {});
    }

    try {
      if (initialData && initialData.id) {
        const updatePayload: UpdateMcpServerPayload = {
          id: initialData.id,
          name: data.name.trim(),
          url: data.url.trim(),
          sectorName: data?.sectorName ?? initialData.sectorName,
          authentication,
        };

        await updateMcpServer.mutateAsync(updatePayload);
      } else {
        const createPayload: CreateMcpServerPayload = {
          name: data.name.trim(),
          url: data.url.trim(),
          sectorName: data?.sectorName,
          authentication,
        };

        await createMcpServer.mutateAsync(createPayload);
      }
      onSaveSuccess?.();
      reset();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save MCP server";
      console.error("MCP save error:", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
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
            <Input
              id="server-name"
              placeholder={!sectorName ? "MCP Server Name" : ""}
              {...register("name", { required: true })}
            />
          </div>

          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="server-url">URL *</Label>
            <Input
              id="server-url"
              placeholder={!sectorName ? "https://api.example.com" : ""}
              {...register("url", { required: true })}
            />
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label htmlFor="sector">Sector Name</Label>
            <Controller
              control={control}
              name="sectorName"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val)}
                  disabled={disableSector || Boolean(sectorName)}
                >
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
                <Label htmlFor="authentication">Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add authentication for the MCP server
                </p>
              </div>
              <div className="flex gap-2">
                {!isJsonMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={enterJsonMode}
                  >
                    JSON
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exitJsonMode}
                  >
                    Switch to Form
                  </Button>
                )}
                {!isJsonMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => append({ key: "", value: "", show: false })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {!isJsonMode ? (
                fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-3 border rounded-lg relative"
                  >
                    <div className="grid gap-2">
                      <Input
                        placeholder="key (e.g., mcp-authentication)"
                        {...register(`authentication.${idx}.key` as const, {
                          required: true,
                        })}
                      />
                      <div className="relative">
                        <Input
                          placeholder="value"
                          type={authWatch[idx]?.show ? "text" : "password"}
                          {...register(`authentication.${idx}.value` as const, {
                            required: true,
                          })}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-10 top-2 h-8 w-8 p-0"
                          onClick={() =>
                            setValue(
                              `authentication.${idx}.show`,
                              !authWatch[idx]?.show
                            )
                          }
                        >
                          {authWatch[idx]?.show ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
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
                ))
              ) : (
                <div>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border p-3 text-sm font-mono bg-background"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder={`{
  "mcp-authentication": "secret"
}`}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter headers as a JSON object with string key-value pairs.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : sectorName
                ? "Save changes"
                : "Create Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
