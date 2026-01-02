// "use client";

// import { useEffect, useState } from "react";
// import { Cpu, Plus, SquarePen, Trash2 } from "lucide-react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
// } from "@/components/ui/card";
// import { Switch } from "@/components/ui/switch";

// import {
//   AiToolsManagementError,
//   AiToolsManagementLoading,
// } from "../../../components/ai-tools/ai-tool-management-loading";
// import { useDeleteAiToolMock, useMcpServersQuery } from "@/queries/aiToolQuery";
// import { Button } from "@/components/ui/button";
// import ConfirmDelete from "@/components/documents/DeleteModal";
// import { dismissToast, toastUtils } from "@/lib/toast-utils";
// import { CreateMcpServerModal } from "@/components/ai-tools/create-mcp-server-modal";

// interface AiTool {
//   id: string;
//   name: string;
//   doc?: string; // using url as doc/description
//   url?: string;
//   sector?: string; // maps from sectorName
//   enabled: boolean; // local toggle, initial from isActive
//   createdAt?: string;
//   updatedAt?: string;
// }

// export default function AiToolsManagementTab() {
//   const { data, isError, isLoading, refetch } = useMcpServersQuery();
//   console.log("MCP Servers data:", data);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const deleteToolMutation = useDeleteAiToolMock();

//   // start empty, populate from API in useEffect
//   const [tools, setTools] = useState<AiTool[]>([]);

//   const [openDeleteModal, setOpenDeleteModal] = useState(false);
//   const [currentDeleteInfo, setCurrentDeleteInfo] = useState<{
//     id: string;
//     fileName: string;
//   } | null>(null);

//   // Sync tools when API data changes (API returns { data: [...] } or just an array)
//   useEffect(() => {
//     const items = Array.isArray(data) ? data : data?.data;
//     if (!items) return;

//     setTools((prev) =>
//       items.map((t: any) => ({
//         id: t.id,
//         name: t.name,
//         doc: t.url,
//         url: t.url,
//         sector: t.sectorName,
//         enabled: prev.find((p) => p.id === t.id)?.enabled ?? !!t.isActive,
//         createdAt: t.createdAt,
//         updatedAt: t.updatedAt,
//       }))
//     );
//   }, [data, refetch]);

//   // Toggle single tool
//   const handleToggle = (toolId: string, enabled: boolean) => {
//     setTools((prev) => prev.map((tool) => (tool.id === toolId ? { ...tool, enabled } : tool)));
//   };

//   // Toggle all tools
//   const handleToggleAll = (enabled: boolean) => {
//     setTools((prev) => prev.map((tool) => ({ ...tool, enabled })));
//   };

//   const handleDelete = async () => {
//     if (!currentDeleteInfo) return;
//     const loadingToastId = toastUtils.generic.loading("Deleting document...");

//     deleteToolMutation.mutate(currentDeleteInfo.id, {
//       onError: (error: unknown) => {
//         dismissToast(loadingToastId);
//         const errorMessage = error instanceof Error ? error.message : undefined;
//         toastUtils.data.deleteError(errorMessage);
//       },
//       onSuccess: () => {
//         dismissToast(loadingToastId);
//         setOpenDeleteModal(false);
//         setCurrentDeleteInfo(null);
//         refetch?.();
//       },
//     });
//   };

//   const handleCreateSuccess = () => {
//     toastUtils.generic.success("MCP server created, refresh list if needed");
//   };

//   const allEnabled = tools.length > 0 && tools.every((tool) => tool.enabled);

//   const toReadableName = (value: string) => value; // names from API are already readable

//   if (isError) return <AiToolsManagementError error={isError} />;
//   if (isLoading) return <AiToolsManagementLoading />;

//   return (
//     <div className="p-6 space-y-6">
//      <div className="flex items-center justify-between">
//   <div className="flex flex-col gap-1">
//     <h1 className="text-2xl font-semibold">AI Tools Management</h1>
//     <h3 className="text-sm text-muted-foreground">
//       Manage MCP tools that the AI can reference.
//     </h3>
//   </div>

//   <Button
//     className="bg-black hover:bg-gray-800"
//     onClick={() => setIsCreateModalOpen(true)}
//   >
//     <Plus className="w-4 h-4 mr-2" />
//     Add MCP Server
//   </Button>
// </div>

//           <div className="space-y-3">
//             {tools.length === 0 ? (
//               <div className="text-center py-12 text-muted-foreground">
//                 <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                 <p>No MCP servers available</p>
//               </div>
//             ) : (
//               tools.map((tool) => (
//                 <div
//                   key={tool.id}
//                   className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
//                 >
//                   <div className="flex items-center gap-4 flex-1">
//                     <div className="rounded-lg bg-muted p-3">
//                       <Cpu className="h-5 w-5 text-muted-foreground" />
//                     </div>

//                     <div className="flex-1">
//                       <div className="flex items-center gap-2">
//                         <div className="font-medium">{toReadableName(tool.name)}</div>
//                         {tool.sector && (
//                           <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
//                             {tool.sector}
//                           </span>
//                         )}
//                       </div>
//                       <div className="text-sm text-muted-foreground">{tool.url || tool.doc}</div>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-4">
//                       <SquarePen className="w-5 h-5 text-muted-foreground" />

//                     <Switch checked={tool.enabled} onCheckedChange={(value) => handleToggle(tool.id, value)} />
                   

//                     <Button
//                       variant="ghost"
//                       size="sm"
//                      className=" text-red-600 hover:text-red-700"
//                       onClick={() => {
//                         setCurrentDeleteInfo({
//                           id: tool.id,
//                           fileName: tool.name,
//                         });
//                         setOpenDeleteModal(true);
//                       }}
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))
//             )}

//             <ConfirmDelete isOpen={openDeleteModal} setIsOpen={setOpenDeleteModal} onConfirm={handleDelete} isDeleting={deleteToolMutation.isPending} item={currentDeleteInfo?.fileName || ""} />
//           </div>

//           <CreateMcpServerModal
//             isOpen={isCreateModalOpen}
//             onClose={() => setIsCreateModalOpen(false)}
//             onCreateSuccess={() => {
//               setIsCreateModalOpen(false);
//               toastUtils.generic.success("MCP server created");
//               refetch?.();
//             }}
//           />
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { Cpu, Plus, SquarePen, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import {
  AiToolsManagementError,
  AiToolsManagementLoading,
} from "../../../components/ai-tools/ai-tool-management-loading";
import { useDeleteAiToolMock, useMcpServersQuery } from "@/queries/aiToolQuery";
import { Button } from "@/components/ui/button";
import ConfirmDelete from "@/components/documents/DeleteModal";
import { dismissToast, toastUtils } from "@/lib/toast-utils";
import { CreateMcpServerModal } from "@/components/ai-tools/create-mcp-server-modal";

export default function AiToolsManagementTab() {
  const { data, isError, isLoading, refetch } = useMcpServersQuery();
  const deleteServerMutation = useDeleteAiToolMock();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentDeleteInfo, setCurrentDeleteInfo] = useState<{ id: string; name: string } | null>(null);

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

  if (isError) return <AiToolsManagementError error={isError} />;
  if (isLoading) return <AiToolsManagementLoading />;

  // servers from query
  const servers = Array.isArray(data) ? data : data?.data 
  console.log("MCP Servers data:", servers);

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
                <SquarePen className="w-5 h-5 text-muted-foreground" />
                <Switch checked={server.isActive || false} /> {/* display only */}
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 p-0"
                  onClick={() => {
                    setCurrentDeleteInfo({ id: server.id, name: server.name });
                    setOpenDeleteModal(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        <ConfirmDelete
          isOpen={openDeleteModal}
          setIsOpen={setOpenDeleteModal}
          onConfirm={handleDelete}
          isDeleting={deleteServerMutation.isPending}
          item={currentDeleteInfo?.name || ""}
        />
      </div>

      <CreateMcpServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSuccess={() => {
          setIsCreateModalOpen(false);
          toastUtils.generic.success("MCP server created");
          refetch?.();
        }}
      />
    </div>
  );
}
