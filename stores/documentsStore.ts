"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { DocumentSchema, type Document } from "@/lib/schemas";

interface DocumentsState {
  // State
  documents: Document[];
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;

  // Internal actions for hydration
  hydrate: (data: { documents: Document[] }) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      documents: [],
      isLoading: false,
      isInitialized: false,
      error: null,

      // Actions
      setDocuments: (documents) => {
        set(
          {
            documents,
            error: null,
          },
          false,
          "setDocuments"
        );
      },

      addDocument: (document) => {
        const currentDocuments = get().documents;
        set(
          {
            documents: [...currentDocuments, document],
          },
          false,
          "addDocument"
        );
      },

      removeDocument: (documentId) => {
        const currentDocuments = get().documents;
        set(
          {
            documents: currentDocuments.filter((doc) => doc.id !== documentId),
          },
          false,
          "removeDocument"
        );
      },

      updateDocument: (documentId, updates) => {
        const currentDocuments = get().documents;
        set(
          {
            documents: currentDocuments.map((doc) =>
              doc.id === documentId ? { ...doc, ...updates } : doc
            ),
          },
          false,
          "updateDocument"
        );
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, "setLoading");
      },

      setError: (error) => {
        set(
          {
            error,
            isLoading: false,
          },
          false,
          "setError"
        );
      },

      reset: () => {
        set(
          {
            documents: [],
            isLoading: false,
            error: null,
            isInitialized: false,
          },
          false,
          "reset"
        );
      },

      hydrate: (data) => {
        set(
          {
            documents: data.documents,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "hydrate"
        );
      },
    }),
    {
      name: "documents-store",
    }
  )
);

// Selector hooks for better performance
export const useDocuments = () => useDocumentsStore((state) => state.documents);
export const useDocumentsLoading = () => useDocumentsStore((state) => state.isLoading);
export const useDocumentsError = () => useDocumentsStore((state) => state.error);
export const useDocumentsInitialized = () => useDocumentsStore((state) => state.isInitialized);

// Actions hooks - individual hooks to prevent re-render issues
export const useSetDocuments = () => useDocumentsStore((state) => state.setDocuments);
export const useAddDocument = () => useDocumentsStore((state) => state.addDocument);
export const useRemoveDocument = () => useDocumentsStore((state) => state.removeDocument);
export const useUpdateDocument = () => useDocumentsStore((state) => state.updateDocument);
export const useSetDocumentsLoading = () => useDocumentsStore((state) => state.setLoading);
export const useSetDocumentsError = () => useDocumentsStore((state) => state.setError);
export const useResetDocuments = () => useDocumentsStore((state) => state.reset);

// Legacy actions hook - kept for backward compatibility but avoid using in components
// that re-render frequently as it creates a new object on each render
export const useDocumentsActions = () =>
  useDocumentsStore((state) => ({
    setDocuments: state.setDocuments,
    addDocument: state.addDocument,
    removeDocument: state.removeDocument,
    updateDocument: state.updateDocument,
    setLoading: state.setLoading,
    setError: state.setError,
    reset: state.reset,
  }));
