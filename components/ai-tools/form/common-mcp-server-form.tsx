"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { DialogFooter } from "@/components/ui/dialog";
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
import { Eye, EyeOff, Plus, Trash } from "lucide-react";
import type { FormValues, AuthEntry } from "@/types/ai";
import truncateMiddleUrl from "@/lib/utils";
import { SECTORS, TYPE } from "@/constants/sector";
import { toastUtils } from "@/lib/toast-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { mcpServerSchema } from "./schema";
interface CommonMcpServerFormProps {
  onSubmit: (data: FormValues) => void;
  defaultValues?: FormValues;
  isEdit?: boolean;
  onCancel?: () => void;
  isPending?: boolean;
}

export function CommonMcpServerForm({
  onSubmit,
  defaultValues,
  isEdit = false,
  onCancel,
  isPending = false,
}: CommonMcpServerFormProps) {
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mcpServerSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "authentication",
  });

  const authWatch = watch("authentication");
  const typeWatch = watch("type");

  const typeDescription =
    typeWatch === "INTERNAL"
      ? "No workspace-specific authorization required."
      : typeWatch === "EXTERNAL"
        ? "Requires workspace-specific API keys or authorization."
        : "";

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
        isEncrypted: true,
      }));
      setValue("authentication", arr);
      setIsJsonMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON";
      toastUtils.generic.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="server-name">Name *</Label>
        <Input
          id="server-name"
          {...register("name")}
          placeholder="e.g. Banking MCP "
          disabled={isPending}
        />
        {errors.name?.message && (
          <p className="text-sm text-destructive">
            {String(errors.name.message)}
          </p>
        )}
      </div>

      {/* URL */}
      <div className="grid gap-2">
        <Label htmlFor="server-url">URL *</Label>
        <div className="relative">
          <Input
            id="server-url"
            {...register("url")}
            readOnly={Boolean(isEdit)}
            disabled={isPending}
            className={isEdit ? "opacity-50 text-transparent" : ""}
            placeholder="https://mcp.example.com"
          />
          {isEdit && defaultValues?.url && (
            <div className="absolute inset-y-0 left-3 right-3 flex items-center text-xs text-muted-foreground overflow-x-auto whitespace-nowrap pr-3">
              <span className="inline-block">{defaultValues.url}</span>
            </div>
          )}
          {errors.url?.message && (
            <p className="text-sm text-destructive mt-1">
              {String(errors.url.message)}
            </p>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
              disabled={isPending}
            >
              <SelectTrigger id="type" className="h-12 w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {typeDescription ? (
          <p className="text-sm text-muted-foreground">{typeDescription}</p>
        ) : null}
      </div>
      {/* Sector */}
      <div className="grid gap-2">
        <Label htmlFor="sector">Sector Name</Label>
        <Controller
          control={control}
          name="sectorName"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
              disabled={isPending}
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
                disabled={isPending}
                className="cursor-pointer"
              >
                JSON
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exitJsonMode}
                disabled={isPending}
                className="cursor-pointer"
              >
                Switch to Form
              </Button>
            )}
            {!isJsonMode && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  append({
                    key: "",
                    value: "",
                    show: false,
                    isEncrypted: false,
                  })
                }
                disabled={isPending}
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {!isJsonMode ? (
            fields.map((field, idx) => (
              <div key={field.id} className="p-3 border rounded-lg relative">
                <div className="grid gap-2">
                  <Input
                    placeholder="key (e.g., mcp-authentication)"
                    {...register(`authentication.${idx}.key` as const)}
                    disabled={isPending}
                  />
                  {errors.authentication?.[idx]?.key?.message && (
                    <p className="text-sm text-destructive">
                      {String(errors.authentication?.[idx]?.key?.message)}
                    </p>
                  )}
                  <div className="relative">
                    <Input
                      placeholder="value"
                      type={authWatch[idx]?.show ? "text" : "password"}
                      {...register(`authentication.${idx}.value` as const)}
                      className="pr-18"
                      disabled={isPending}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setValue(`authentication.${idx}.value`, newValue);
                        setValue(`authentication.${idx}.isEncrypted`, false); //  mark as plain text
                      }}
                    />
                    {errors.authentication?.[idx]?.value?.message && (
                      <p className="text-sm text-destructive mt-1">
                        {String(errors.authentication?.[idx]?.value?.message)}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 p-0 cursor-pointer"
                      onClick={() =>
                        setValue(
                          `authentication.${idx}.show`,
                          !authWatch[idx]?.show,
                        )
                      }
                      disabled={isPending}
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-destructive cursor-pointer"
                      onClick={() => remove(idx)}
                      disabled={isPending}
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
                placeholder={`{\n  "mcp-authentication": "secret"\n}`}
                disabled={isPending}
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
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isEdit
            ? isPending
              ? "Saving..."
              : "Save Changes"
            : isPending
              ? "Creating..."
              : "Create Server"}
        </Button>
      </DialogFooter>
    </form>
  );
}
