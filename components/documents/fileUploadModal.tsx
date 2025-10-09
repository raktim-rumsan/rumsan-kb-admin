"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toastUtils } from "@/lib/toast-utils";
import { useDocUploadMutation } from "@/queries/documentsQuery";

interface SimpleFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  maxDocuments?: number;
  currentDocumentCount?: number;
  isPersonalWorkspace?: boolean;
}

export function SimpleFileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  maxDocuments,
  currentDocumentCount = 0,
  isPersonalWorkspace = false,
}: SimpleFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadMutation = useDocUploadMutation(() => {
    toastUtils.fileUpload.success(selectedFile?.name || "File");
    setSelectedFile(null);
    onUploadSuccess();
    setIsUploading(false);
    onClose(); // Close the modal after successful upload
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toastUtils.generic.error("No file selected", "Please select a file to upload");
      return;
    }

    // Check document limit for demo workspaces
    if (isPersonalWorkspace && maxDocuments !== undefined && currentDocumentCount >= maxDocuments) {
      toastUtils.generic.error(
        "Document limit reached",
        `Demo workspaces are limited to ${maxDocuments} documents. Please upgrade to upload more files.`
      );
      return;
    }

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toastUtils.fileUpload.sizeLimitExceeded();
      return;
    }

    setIsUploading(true);

    // Show upload started toast
    toastUtils.fileUpload.started(selectedFile.name);

    uploadMutation.mutate(selectedFile, {
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : undefined;
        toastUtils.fileUpload.error(errorMessage);
        setIsUploading(false);
      },
      onSuccess: () => {
        // Success is handled in the mutation callback above
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Upload File</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-gray-600">Select a file from your computer to upload.</p>
          <div className="space-y-2">
            <Label htmlFor="file-upload">File</Label>
            <Input id="file-upload" type="file" onChange={handleFileChange} />
          </div>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              File size shouldn&apos;t exceed 10 MB.
            </AlertDescription>
          </Alert>
          {isPersonalWorkspace && maxDocuments !== undefined && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Demo workspace: {currentDocumentCount}/{maxDocuments} documents used.
                {currentDocumentCount >= maxDocuments
                  ? " Upgrade to upload more files."
                  : " Upgrade for unlimited documents."}
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleUpload}
            disabled={
              isUploading ||
              !selectedFile ||
              (isPersonalWorkspace &&
                maxDocuments !== undefined &&
                currentDocumentCount >= maxDocuments)
            }
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
