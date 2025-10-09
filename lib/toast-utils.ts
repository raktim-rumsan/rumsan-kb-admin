import { toast } from "sonner";

// Common toast utilities for consistent messaging throughout the app

export const toastUtils = {
  // File upload related toasts
  fileUpload: {
    started: (fileName: string) =>
      toast.loading("Uploading file...", {
        description: `Uploading ${fileName}`,
        id: "file-upload",
      }),

    success: (fileName: string) => {
      toast.dismiss("file-upload");
      return toast.success("File uploaded successfully!", {
        description: `${fileName} has been uploaded to your workspace.`,
        duration: 4000,
      });
    },

    error: (error?: string) => {
      toast.dismiss("file-upload");
      return toast.error("Failed to upload file", {
        description: error || "An error occurred while uploading the file.",
        duration: 5000,
      });
    },

    sizeLimitExceeded: () =>
      toast.error("File size too large", {
        description: "Please select a file smaller than 10MB.",
        duration: 4000,
      }),
  },

  // Authentication related toasts
  auth: {
    loginSuccess: () =>
      toast.success("Welcome back!", {
        description: "You have been successfully logged in.",
        duration: 3000,
      }),

    loginError: (error?: string) =>
      toast.error("Login failed", {
        description: error || "Please check your credentials and try again.",
        duration: 5000,
      }),

    logoutSuccess: () =>
      toast.success("Logged out", {
        description: "You have been successfully logged out.",
        duration: 3000,
      }),

    sessionExpired: () =>
      toast.warning("Session expired", {
        description: "Please log in again to continue.",
        duration: 5000,
      }),
  },

  // Data operations
  data: {
    saveSuccess: (itemName?: string) =>
      toast.success("Saved successfully", {
        description: itemName ? `${itemName} has been saved.` : "Your changes have been saved.",
        duration: 3000,
      }),

    saveError: (error?: string) =>
      toast.error("Failed to save", {
        description: error || "An error occurred while saving. Please try again.",
        duration: 5000,
      }),

    deleteSuccess: (itemName?: string) =>
      toast.success("Deleted successfully", {
        description: itemName ? `${itemName} has been deleted.` : "Item has been deleted.",
        duration: 3000,
      }),

    deleteError: (error?: string) =>
      toast.error("Failed to delete", {
        description: error || "An error occurred while deleting. Please try again.",
        duration: 5000,
      }),
  },

  // Generic toasts
  generic: {
    loading: (message: string) =>
      toast.loading(message, {
        duration: Infinity, // Will stay until dismissed
      }),

    success: (title: string, description?: string) =>
      toast.success(title, {
        description,
        duration: 3000,
      }),

    error: (title: string, description?: string) =>
      toast.error(title, {
        description,
        duration: 5000,
      }),

    info: (title: string, description?: string) =>
      toast.info(title, {
        description,
        duration: 3000,
      }),

    warning: (title: string, description?: string) =>
      toast.warning(title, {
        description,
        duration: 4000,
      }),
  },
};

// Helper function to dismiss all toasts
export const dismissAllToasts = () => toast.dismiss();

// Helper function to dismiss a specific toast by ID
export const dismissToast = (id: string | number) => toast.dismiss(id);
