"use client";

import { useState } from "react";
import {
  Server,
  Plus,
  SquarePen,
  Trash2,
  ChevronDown,
  RefreshCcw,
  Copy,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import {
  AiToolsManagementError,
  AiToolsManagementLoading,
} from "@/components/ai-tools/ai-tool-management-loading";

import {
  useMCPDeleteMutation,
  useMcpServersQuery,
  useMcpServerBySectorQuery,
  useToggleMcpToolsMutation,
  useSyncMcpServerToolsMutation,
  useUpdateMcpServerMutation,
} from "@/queries/aiToolQuery";
import type { McpServer } from "@/types/ai";

import ConfirmDelete from "@/components/documents/DeleteModal";
import { dismissToast, toastUtils } from "@/lib/toast-utils";
import { CreateMcpServerModal } from "@/components/ai-tools/create-mcp-server-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AiToolsManagementTab() {
  const { data: servers, isError, isLoading, refetch } = useMcpServersQuery();
  const deleteServerMutation = useMCPDeleteMutation();
  const toggleServerMutation = useUpdateMcpServerMutation();
  const toggleToolMutation = useToggleMcpToolsMutation();
  const syncToolsMutation = useSyncMcpServerToolsMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentDeleteInfo, setCurrentDeleteInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingSector, setEditingSector] = useState<string | null>(null);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);

  // Fetch server details by sector when editing
  const { data: editingServerData, isLoading: isEditingLoading } =
    useMcpServerBySectorQuery(editingSector || "");

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

  const handleToggleServer = (serverId: string, newValue: boolean) => {
    toggleServerMutation.mutate({ serverId: serverId, isActive: newValue });
  };

  const handleToggleTool = (
    serverId: string,
    toolId: string,
    newValue: boolean
  ) => {
    toggleToolMutation.mutate({ serverId, toolId, isActive: newValue });
  };

  const handleSync = (serverId: string) => {
    syncToolsMutation.mutate(serverId);
  };

  const humanizeToolName = (name: string): string =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toastUtils.generic.success("Copied to clipboard");
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

        <Button
          className="bg-black hover:bg-gray-800"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add MCP Server
        </Button>
      </div>

      <div className="space-y-3">
        {!servers || servers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No MCP servers available</p>
          </div>
        ) : (
          servers.map((server: McpServer) => (
            <div
              key={server.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <Button
                    variant="ghost"
                    aria-label="expand"
                    onClick={() =>
                      setExpandedServerId(
                        expandedServerId === server.id ? null : server.id
                      )
                    }
                    className="cursor-pointer transform transition-transform"
                  >
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground  ${
                        expandedServerId === server.id ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  <div className="rounded-lg bg-muted p-3">
                    <Server className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{server.name}</div>
                      {server.sectorName && (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                          {server.sectorName.charAt(0).toUpperCase() +
                            server.sectorName.slice(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground ">
                      <span>{server.url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer p-1"
                        onClick={() => handleCopy(server.url)}
                      >
                        <Copy className="w-4 h-4 " />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer p-2"
                          onClick={() => handleSync(server.id)}
                        >
                          <RefreshCcw className="w-5 h-5 mr-2" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent>
                        <p>Sync MCP tools</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer p-2"
                    onClick={() => {
                      setEditingSector(server.sectorName ?? ""); // fetch by sector
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <SquarePen className="w-5 h-5 mr-2" />
                  </Button>
                  <Switch
                    checked={server.isActive}
                    disabled={toggleServerMutation.isPending}
                    onCheckedChange={(newValue) =>
                      handleToggleServer(server.id, newValue)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-red-600 hover:text-red-700 p-2"
                    onClick={() => {
                      setCurrentDeleteInfo({
                        id: server.id,
                        name: server.name,
                      });
                      setOpenDeleteModal(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>

              {expandedServerId === server.id && (
                <div className="border-t p-4 bg-transparent">
                  <div className="text-xs text-muted-foreground font-medium mb-3">
                    AVAILABLE TOOLS ({server.mcpTools?.length ?? 0})
                  </div>

                  <div className="space-y-3">
                    {(server.mcpTools ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No tools available for this server.
                      </div>
                    ) : (
                      (server.mcpTools ?? []).map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div>
                            <div className="font-medium">
                              {humanizeToolName(tool.name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tool.description}
                            </div>
                          </div>

                          <Switch
                            checked={tool.isActive}
                            disabled={toggleToolMutation.isPending}
                            onCheckedChange={(newValue) =>
                              handleToggleTool(server.id, tool.id, newValue)
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
