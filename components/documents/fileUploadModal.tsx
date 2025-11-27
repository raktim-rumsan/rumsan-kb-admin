"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
}

export function SimpleFileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  maxDocuments,
  currentDocumentCount = 0,
}: SimpleFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [industry, setIndustry] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadMutation = useDocUploadMutation(() => {
    toastUtils.fileUpload.success(selectedFile?.name || "File");
    setSelectedFile(null);
    setIndustry("");
    onUploadSuccess();
    setIsUploading(false);
    onClose(); // Close the modal after successful upload
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toastUtils.generic.error("No file selected", "Please select a file to upload");
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

    // pass both file and industry to the mutation
    uploadMutation.mutate(
      { file: selectedFile, industry },
      {
        onError: (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : undefined;
          toastUtils.fileUpload.error(errorMessage);
          setIsUploading(false);
        },
        onSuccess: () => {
          // Success is handled in the mutation callback above
        },
      }
    );
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
            <Label htmlFor="industry-select">Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry-select" className="w-full">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banking">Banking</SelectItem>
                <SelectItem value="dentistry">Dentistry</SelectItem>
                <SelectItem value="veterinary">Veterinary</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
