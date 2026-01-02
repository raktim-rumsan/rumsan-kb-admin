export type AuthEntry = { key: string; value: string; show?: boolean };

export type FormValues = {
  name: string;
  url: string;
  sectorName?: string;
  authentication: AuthEntry[];
};

export interface McpServer {
  id: string;
  name: string;
  url: string;
  sectorName?: string;
  isActive?: boolean;
  authentication?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMcpServerPayload {
  name: string;
  url: string;
  sectorName?: string;
  authentication: Record<string, string>;
}

export interface UpdateMcpServerPayload {
  id: string;
  name?: string;
  url?: string;
  sectorName?: string;
  authentication?: Record<string, string>;
}

export type ApiResponse<T> = { data?: T; message?: string; error?: string };
