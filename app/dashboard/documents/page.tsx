"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Trash2 } from "lucide-react";
import { toastUtils, dismissToast } from "@/lib/toast-utils";
import { SimpleFileUploadModal } from "@/components/documents/fileUploadModal";
import { useDocsQuery, useDocDeleteMutation, useEmbeddingMutation, useUnembeddingMutation } from "@/queries/documentsQuery";
import { useDocuments, useSetDocuments } from "@/stores/documentsStore";
import { DocumentsResponseSchema } from "@/lib/schemas";
import { Switch } from "@/components/ui/switch";

interface Document {
  id: string;
  orgId: string;
  fileName: string;
  industry: string;
  url: string;
  status: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [trainingDocumentId, setTrainingDocumentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Use both TanStack Query and Zustand store
  const { data, isLoading, error,refetch } = useDocsQuery();
  const documentsFromStore = useDocuments();
  const setDocuments = useSetDocuments();

  // Prefer store documents if available, otherwise use query data
  const documents = documentsFromStore.length > 0 ? documentsFromStore : data?.data || [];
  const currentDocumentCount = documents.length;

  // Sync query data with store when it changes
  useEffect(() => {
    if (data?.data) {
      try {
        const validatedData = DocumentsResponseSchema.parse(data);
        setDocuments(validatedData.data);
      } catch (error) {
        console.error("Failed to validate documents data:", error);
        // Fallback to using raw data
        setDocuments(data.data);
      }
    }
  }, [data, setDocuments]);

  const embeddingMutation = useEmbeddingMutation(() => {
    toastUtils.generic.success("Training completed", "Document has been successfully trained.");
    // Note: The store will be updated when the query refetches
  });

  const unembeddingMutation = useUnembeddingMutation(() => {
    toastUtils.generic.success("Unembed completed", "Document embeddings removed.");
  });

  // Toggle handler: when switched ON call embeddings API; when OFF call unembedding API
  const handleToggle = (id: string, checked: boolean, fileName?: string) => {
    if (checked) {
      const loadingToastId = toastUtils.generic.loading(`Training document...`);
      setTrainingDocumentId(id);

      embeddingMutation.mutate(id, {
        onError: (error: unknown) => {
          dismissToast(loadingToastId);
          setTrainingDocumentId(null);

          const backendMessage = error instanceof Error ? error.message : undefined;
          const errorTitle = "Training failed";
          const errorMessage = backendMessage ?? `Failed to train "${fileName || id}."`;
          toastUtils.generic.error(errorTitle, errorMessage);
        },
        onSuccess: () => {
          dismissToast(loadingToastId);
          setTrainingDocumentId(null);
        },
      });
    } else {
      const loadingToastId = toastUtils.generic.loading(`Removing document from knowledge base...`);
      setTrainingDocumentId(id);

      unembeddingMutation.mutate(id, {
        onError: (error: unknown) => {
          dismissToast(loadingToastId);
          setTrainingDocumentId(null);

          const backendMessage = error instanceof Error ? error.message : undefined;
          const errorTitle = "Unembed failed";
          const errorMessage = backendMessage ?? `Failed to remove embeddings for "${fileName || id}."`;
          toastUtils.generic.error(errorTitle, errorMessage);
        },
        onSuccess: () => {
          dismissToast(loadingToastId);
          setTrainingDocumentId(null);
        },
      });
    }
  };

  const deleteMutation = useDocDeleteMutation(() => {
    toastUtils.data.deleteSuccess("Document");
    // Note: The store will be updated when the query refetches
  });

  const handleDelete = async (id: string, fileName: string) => {
    if (
      window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)
    ) {
      const loadingToastId = toastUtils.generic.loading("Deleting document...");

      deleteMutation.mutate(id, {
        onError: (error: unknown) => {
          dismissToast(loadingToastId);
          const errorMessage = error instanceof Error ? error.message : undefined;
          toastUtils.data.deleteError(errorMessage);
        },
        onSuccess: () => {
          dismissToast(loadingToastId);
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">My Resources</h1>
        </div>
        <Button
          className="bg-black hover:bg-gray-800"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATE</TableHead>
                      <TableHead>FILE NAME</TableHead>
                       <TableHead>INDUSTRY</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: Document) => (
                      <TableRow key={doc.id}>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.fileName.replaceAll("_", " ")}
                          </div>
                        </TableCell>
                        <TableCell>{(doc.industry).toLocaleUpperCase()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">                      
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doc.id, doc.fileName)}
                              className="text-red-600 hover:text-red-700"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Switch
                              checked={doc.status !== 'PENDING'}
                              onCheckedChange={(checked) => handleToggle(doc.id, Boolean(checked), doc.fileName)}
                              disabled={trainingDocumentId === doc.id}
                              aria-label={`Toggle document ${doc.fileName}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {error ? (
                  <div className="text-center py-8 text-red-500">
                    Failed to load documents: {error.message}
                  </div>
                ) : documents.length === 0 && !isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    No documents uploaded yet
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <SimpleFileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          // Manually refetch documents to ensure the list is updated
          refetch();
        }}
        currentDocumentCount={currentDocumentCount}
      />
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
