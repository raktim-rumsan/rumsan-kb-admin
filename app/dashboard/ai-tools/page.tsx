


"use client";

import { useState } from "react";
import { Cpu, Plus, SquarePen, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import {
  AiToolsManagementError,
  AiToolsManagementLoading,
} from "../../../components/ai-tools/ai-tool-management-loading";

import {
  useMCPDeleteMutation,
  useMcpServersQuery,
  useToggleMcpServerMutation,
  useMcpServerBySectorQuery,
} from "@/queries/aiToolQuery";

import ConfirmDelete from "@/components/documents/DeleteModal";
import { dismissToast, toastUtils } from "@/lib/toast-utils";
import { CreateMcpServerModal } from "@/components/ai-tools/create-mcp-server-modal";

export default function AiToolsManagementTab() {
  const { data: servers , isError, isLoading, refetch } = useMcpServersQuery();
  const deleteServerMutation = useMCPDeleteMutation();
  const toggleServerMutation = useToggleMcpServerMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentDeleteInfo, setCurrentDeleteInfo] = useState<{ id: string; name: string } | null>(null);
  const [editingSector, setEditingSector] = useState<string | null>(null);

  // Fetch server details by sector when editing
  const { data: editingServerData, isLoading: isEditingLoading } = useMcpServerBySectorQuery(
    editingSector || undefined
  );

  const handleDelete = () => {
    if (!currentDeleteInfo) return;
    const loadingToastId = toastUtils.generic.loading("Deleting MCP server...");

    deleteServerMutation.mutate(currentDeleteInfo.id, {
      onError: (error: unknown) => {
        dismissToast(loadingToastId);
        const message = error instanceof Error ? error.message : undefined;
        toastUtils.data.deleteError(message);
      },
      onSuccess: () => {
        dismissToast(loadingToastId);
        setOpenDeleteModal(false);
        setCurrentDeleteInfo(null);
        refetch?.();
      },
    });
  };

  const handleToggle = (serverId: string) => {
    toggleServerMutation.mutate(serverId);
  };

  if (isError) return <AiToolsManagementError error={isError} />;
  if (isLoading) return <AiToolsManagementLoading />;


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">AI Tools Management</h1>
          <h3 className="text-sm text-muted-foreground">
            Manage MCP tools that the AI can reference.
          </h3>
        </div>

        <Button className="bg-black hover:bg-gray-800" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add MCP Server
        </Button>
      </div>

      <div className="space-y-3">
        {!servers || servers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No MCP servers available</p>
          </div>
        ) : (
          servers.map((server: any) => (
            <div
              key={server.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="rounded-lg bg-muted p-3">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{server.name}</div>
                    {server.sectorName && (
                      <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        {server.sectorName}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{server.url}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  onClick={() => {
                    setEditingSector(server.sectorName); // fetch by sector
                    setIsCreateModalOpen(true);
                  }}
                >
                  <SquarePen className="w-5 h-5 mr-2" />
                </Button>

                {/* Toggle Active */}
                <Switch
                  checked={server.isActive}
                  disabled={toggleServerMutation.isPending}
                  onCheckedChange={() => handleToggle(server.id)}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 p-2"
                  onClick={() => {
                    setCurrentDeleteInfo({ id: server.id, name: server.name });
                    setOpenDeleteModal(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Delete confirmation modal */}
        <ConfirmDelete
          isOpen={openDeleteModal}
          setIsOpen={setOpenDeleteModal}
          onConfirm={handleDelete}
          isDeleting={deleteServerMutation.isPending}
          item={currentDeleteInfo?.name || ""}
        />
      </div>

      {/* Create/Edit MCP Server Modal */}
      <CreateMcpServerModal
        key={editingServerData?.id ?? "create"}
        isOpen={isCreateModalOpen}
        initialData={editingServerData} // prefill data fetched by sector
        sectorName={editingServerData?.sectorName}
        disableSector={Boolean(editingServerData)} // disable dropdown when editing
        loading={isEditingLoading}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSector(null);
        }}
        onSaveSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingSector(null);
          refetch?.();
        }}
      />
    </div>
  );
}
